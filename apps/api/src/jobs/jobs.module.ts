import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { RetentionJob } from './retention.job';

@Module({
  imports: [StorageModule],
  providers: [RetentionJob],
})
export class JobsModule {}
