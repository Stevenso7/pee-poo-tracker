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
    @Query('tz') tz?: string,
  ) {
    const tzOffset = Math.max(-840, Math.min(840, Number(tz) || 0));
    const localToday = new Date(Date.now() + tzOffset * 60_000)
      .toISOString()
      .slice(0, 10);
    const end = to ?? localToday;
    const start =
      from ??
      new Date(Date.parse(`${end}T00:00:00Z`) - 29 * 86_400_000)
        .toISOString()
        .slice(0, 10);
    return this.stats.summary(user.userId, start, end, tzOffset);
  }
}
