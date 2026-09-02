import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserInfo,
} from '../common/decorators/current-user.decorator';
import { AnalysesService } from './analyses.service';
import { AnalyzeDto } from './dto/analyze.dto';
import { BatchAnalyzeDto } from './dto/batch-analyze.dto';

@Controller('records')
@UseGuards(JwtAuthGuard)
export class AnalysesController {
  constructor(private readonly analyses: AnalysesService) {}

  @Post(':id/analyze')
  analyze(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id') id: string,
    @Body() dto: AnalyzeDto,
  ) {
    return this.analyses.analyze(user.userId, id, dto?.force ?? false);
  }

  @Get(':id/analysis')
  getCached(@CurrentUser() user: CurrentUserInfo, @Param('id') id: string) {
    return this.analyses.getCached(user.userId, id);
  }

  @Post('batch-analyze')
  batchAnalyze(
    @CurrentUser() user: CurrentUserInfo,
    @Body() dto: BatchAnalyzeDto,
  ) {
    return this.analyses.batchAnalyze(
      user.userId,
      dto.type,
      dto.days,
      dto.force ?? false,
    );
  }

  @Get('analyses')
  getUserAnalyses(
    @CurrentUser() user: CurrentUserInfo,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.analyses.getUserAnalyses(user.userId, {
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
  }
}
