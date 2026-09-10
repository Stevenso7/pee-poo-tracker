import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class RetentionJob {
  private readonly logger = new Logger(RetentionJob.name);
  private readonly BATCH_SIZE = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Runs daily at 03:00 Asia/Hong_Kong. */
  @Cron('0 3 * * *', {
    name: 'purge-expired-photos',
    timeZone: 'Asia/Hong_Kong',
  })
  async purgeExpiredPhotos() {
    const profiles = await this.prisma.profile.findMany({
      where: { photoRetentionDays: { gt: 0 } },
    });

    let totalPurged = 0;

    for (const profile of profiles) {
      const cutoff = new Date(
        Date.now() - profile.photoRetentionDays * 24 * 60 * 60 * 1000,
      );

      const records = await this.prisma.record.findMany({
        where: {
          userId: profile.userId,
          photoStoragePath: { not: null },
          photoUploadedAt: { lt: cutoff },
        },
        select: { id: true, photoStoragePath: true },
      });

      if (records.length === 0) {
        continue;
      }

      // Process in batches to avoid long-running transactions and connection timeouts
      for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
        const batch = records.slice(i, i + this.BATCH_SIZE);
        const storagePaths = batch
          .map((r) => r.photoStoragePath)
          .filter((p): p is string => p !== null);

        // Delete from storage in parallel
        await Promise.allSettled(
          storagePaths.map((path) =>
            this.storage.delete(path).catch((err) => {
              this.logger.warn(`Storage delete failed for ${path}: ${err.message}`);
            }),
          ),
        );

        // Batch update database records
        const ids = batch.map((r) => r.id);
        await this.prisma.record.updateMany({
          where: { id: { in: ids } },
          data: {
            photoStoragePath: null,
            photoContentType: null,
            photoSizeBytes: null,
            photoUploadedAt: null,
          },
        });

        totalPurged += batch.length;
      }
    }

    if (totalPurged > 0) {
      this.logger.log(`Purged ${totalPurged} expired photo(s)`);
    }
  }
}
