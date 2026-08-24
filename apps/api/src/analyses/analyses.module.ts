import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { AnalysesService } from './analyses.service';
import { AnalysesController } from './analyses.controller';
import { GeminiService } from './gemini.service';

@Module({
  imports: [StorageModule],
  controllers: [AnalysesController],
  providers: [AnalysesService, GeminiService],
})
export class AnalysesModule {}
