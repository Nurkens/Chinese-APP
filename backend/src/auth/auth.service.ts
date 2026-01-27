import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          { username: registerDto.username },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user and initial progress
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        isGuest: false,
        progress: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            hskLevel: 1,
            totalWords: 0,
            targetWords: 1200,
          },
        },
      },
      include: {
        progress: true,
      },
    });

    const token = this.generateToken(user.id, user.username, user.isGuest);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest,
        progress: user.progress,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
      include: { progress: true },
    });

    if (!user || user.isGuest || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.username, user.isGuest);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest,
        progress: user.progress,
      },
    };
  }

  async guestLogin(guestLoginDto?: GuestLoginDto) {
    // Create a guest user
    const randomId = Math.random().toString(36).substring(2, 8);
    const guestUsername = guestLoginDto?.username
      ? `guest_${guestLoginDto.username}_${Date.now()}`
      : `guest_${randomId}_${Date.now()}`;

    const user = await this.prisma.user.create({
      data: {
        username: guestUsername,
        isGuest: true,
        progress: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            hskLevel: 1,
            totalWords: 0,
            targetWords: 1200,
          },
        },
      },
      include: {
        progress: true,
      },
    });

    const token = this.generateToken(user.id, user.username, user.isGuest);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        isGuest: user.isGuest,
        progress: user.progress,
      },
    };
  }

  private generateToken(userId: string, username: string, isGuest: boolean): string {
    const payload = { sub: userId, username, isGuest };
    return this.jwtService.sign(payload);
  }
}
