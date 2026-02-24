import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

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

    // Generate unique tag
    const tag = await this.generateUniqueTag(registerDto.username);

    // Create user and initial progress
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        tag,
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
        tag: user.tag,
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
        tag: user.tag,
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

    // Generate unique tag
    const tag = await this.generateUniqueTag(guestUsername);

    const user = await this.prisma.user.create({
      data: {
        username: guestUsername,
        tag,
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
        tag: user.tag,
        isGuest: user.isGuest,
        progress: user.progress,
      },
    };
  }

  async googleLogin(googleUser: GoogleUser) {
    // Check if user with this email already exists
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { progress: true },
    });

    if (!user) {
      // Create new user from Google data
      const username = googleUser.email.split('@')[0] + '_' + Date.now().toString(36);

      // Generate unique tag
      const tag = await this.generateUniqueTag(username);

      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          username: username,
          tag,
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
    }

    const token = this.generateToken(user.id, user.username, user.isGuest);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tag: user.tag,
        isGuest: user.isGuest,
        progress: user.progress,
      },
    };
  }

  async googleLoginWithToken(googleTokenDto: GoogleTokenDto) {
    try {
      // Verify the Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleTokenDto.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      // Use the existing googleLogin method with the verified user data
      const googleUser: GoogleUser = {
        email: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        picture: payload.picture,
      };

      return this.googleLogin(googleUser);
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired Google token');
    }
  }

  private generateToken(userId: string, username: string, isGuest: boolean): string {
    const payload = { sub: userId, username, isGuest };
    return this.jwtService.sign(payload);
  }

  async generateUniqueTag(username: string): Promise<string> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const suffix = Math.floor(1000 + Math.random() * 9000).toString();
      const tag = `${username}#${suffix}`;
      const existing = await this.prisma.user.findUnique({ where: { tag } });
      if (!existing) return tag;
    }
    // Fallback: use timestamp-based suffix
    const tag = `${username}#${Date.now().toString().slice(-4)}`;
    return tag;
  }
}
