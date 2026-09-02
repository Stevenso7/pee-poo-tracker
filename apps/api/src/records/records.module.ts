import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { AnalysesModule } from '../analyses/analyses.module';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';

@Module({
  imports: [StorageModule, AnalysesModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
