import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class RetentionJob {
  private readonly logger = new Logger(RetentionJob.name);

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

    let purged = 0;
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

      for (const record of records) {
        if (record.photoStoragePath) {
          await this.storage
            .delete(record.photoStoragePath)
            .catch((err) => this.logger.warn(`Storage delete failed: ${err.message}`));
        }

        await this.prisma.record.update({
          where: { id: record.id },
          data: {
            photoStoragePath: null,
            photoContentType: null,
            photoSizeBytes: null,
            photoUploadedAt: null,
          },
        });
        purged += 1;
      }
    }

    if (purged > 0) {
      this.logger.log(`Purged ${purged} expired photo(s)`);
    }
  }
}
