import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserInfo,
} from '../common/decorators/current-user.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: CurrentUserInfo,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const end = to ?? new Date().toISOString().slice(0, 10);
    const start =
      from ??
      new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return this.stats.summary(user.userId, start, end);
  }
}
