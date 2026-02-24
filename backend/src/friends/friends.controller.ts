import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AddFriendDto } from './dto/add-friend.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('friends')
  async getFriends(@Request() req) {
    const userId = req.user?.id || req.query?.userId;
    return this.friendsService.getFriends(userId);
  }

  @Post('friends/add')
  async addFriend(@Request() req, @Body() addFriendDto: AddFriendDto) {
    const userId = req.user?.id || req.body?.userId;
    return this.friendsService.addFriend(userId, addFriendDto.tag);
  }

  @Delete('friends/:friendId')
  async removeFriend(@Request() req, @Param('friendId') friendId: string) {
    const userId = req.user?.id;
    return this.friendsService.removeFriend(userId, friendId);
  }

  @Get('friends/search')
  async searchByTag(@Query('tag') tag: string) {
    return this.friendsService.searchByTag(tag);
  }

  @Get('leaderboard/global')
  async getGlobalLeaderboard() {
    return this.friendsService.getGlobalLeaderboard();
  }

  @Get('leaderboard/friends')
  async getFriendsLeaderboard(@Request() req) {
    const userId = req.user?.id || req.query?.userId;
    return this.friendsService.getFriendsLeaderboard(userId);
  }
}
