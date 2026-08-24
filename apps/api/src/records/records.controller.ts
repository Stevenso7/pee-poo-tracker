import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserInfo,
} from '../common/decorators/current-user.decorator';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { ConfirmPhotoDto } from './dto/confirm-photo.dto';

@Controller('records')
@UseGuards(JwtAuthGuard)
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserInfo, @Body() dto: CreateRecordDto) {
    return this.records.create(user.userId, dto);
  }

  @Post(':id/photo/confirm')
  confirmPhoto(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id') id: string,
    @Body() dto: ConfirmPhotoDto,
  ) {
    return this.records.confirmPhoto(user.userId, id, dto);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserInfo,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.records.list(user.userId, {
      type,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id/photo')
  photo(@CurrentUser() user: CurrentUserInfo, @Param('id') id: string) {
    return this.records.getPhotoUrl(user.userId, id);
  }

  @Get(':id')
  get(@CurrentUser() user: CurrentUserInfo, @Param('id') id: string) {
    return this.records.findOwned(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
  ) {
    return this.records.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserInfo, @Param('id') id: string) {
    return this.records.remove(user.userId, id);
  }
}
