import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserInfo,
} from '../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get(@CurrentUser() user: CurrentUserInfo) {
    return this.settings.get(user.userId);
  }

  @Patch()
  update(
    @CurrentUser() user: CurrentUserInfo,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settings.update(user.userId, dto);
  }
}
