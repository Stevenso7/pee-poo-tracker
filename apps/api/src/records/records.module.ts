import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';

@Module({
  imports: [StorageModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
