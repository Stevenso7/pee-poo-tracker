import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserInfo,
} from '../common/decorators/current-user.decorator';
import { AnalysesService } from './analyses.service';
import { AnalyzeDto } from './dto/analyze.dto';

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
}
