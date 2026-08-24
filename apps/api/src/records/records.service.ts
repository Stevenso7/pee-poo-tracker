import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { ConfirmPhotoDto } from './dto/confirm-photo.dto';

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private photoPath(userId: string, recordId: string) {
    return `records/${userId}/${recordId}.jpg`;
  }

  async create(userId: string, dto: CreateRecordDto) {
    // Ensure the 1:1 profile row exists first (records.userId has an FK to profiles).
    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const recordId = randomUUID();
    const needsPhoto = dto.needsPhotoUpload === true;
    const photoStoragePath = needsPhoto
      ? this.photoPath(userId, recordId)
      : undefined;

    const record = await this.prisma.record.create({
      data: {
        id: recordId,
        userId,
        type: dto.type,
        recordedAt: new Date(dto.recordedAt),
        // Enum fields are Prisma enums; the `as any` avoids the string/union
        // mismatch while keeping runtime values identical.
        peeColor: dto.type === 'PEE' ? ((dto.peeColor as never) ?? null) : null,
        peeFoam: dto.type === 'PEE' ? ((dto.peeFoam as never) ?? null) : null,
        peeVolume: dto.type === 'PEE' ? ((dto.peeVolume as never) ?? null) : null,
        pooColor: dto.type === 'POO' ? ((dto.pooColor as never) ?? null) : null,
        pooConsistency: dto.type === 'POO' ? (dto.pooConsistency ?? null) : null,
        notes: dto.notes,
      },
    });

    let photoUploadUrl: string | undefined;
    if (photoStoragePath) {
      photoUploadUrl = await this.storage.createUploadUrl(photoStoragePath);
    }

    return { record, photoUploadUrl, photoStoragePath };
  }

  async confirmPhoto(
    userId: string,
    recordId: string,
    dto: ConfirmPhotoDto,
  ) {
    const expected = this.photoPath(userId, recordId);
    if (dto.storagePath !== expected) {
      throw new BadRequestException('Invalid storage path');
    }
    await this.findOwned(userId, recordId);

    return this.prisma.record.update({
      where: { id: recordId },
      data: {
        photoStoragePath: dto.storagePath,
        photoContentType: dto.contentType,
        photoSizeBytes: dto.sizeBytes,
        photoUploadedAt: new Date(),
      },
    });
  }

  async findOwned(userId: string, id: string) {
    const record = await this.prisma.record.findFirst({
      where: { id, userId },
      include: { analysis: true },
    });
    if (!record) {
      throw new NotFoundException('Record not found');
    }
    return record;
  }

  async getPhotoUrl(userId: string, id: string) {
    const record = await this.findOwned(userId, id);
    if (!record.photoStoragePath) {
      throw new NotFoundException('Photo not found');
    }
    const url = await this.storage.createSignedUrl(record.photoStoragePath);
    return { url };
  }

  async list(
    userId: string,
    query: {
      type?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);

    const where: Record<string, unknown> = { userId };
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.recordedAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.record.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.record.count({ where }),
    ]);

    return { items, total, hasMore: offset + items.length < total };
  }

  async update(userId: string, id: string, dto: UpdateRecordDto) {
    await this.findOwned(userId, id);

    const data: Record<string, unknown> = {};
    if (dto.recordedAt) data.recordedAt = new Date(dto.recordedAt);
    if (dto.type === 'PEE') {
      data.peeColor = dto.peeColor ?? null;
      data.peeFoam = dto.peeFoam ?? null;
      data.peeVolume = dto.peeVolume ?? null;
      data.pooColor = null;
      data.pooConsistency = null;
    } else if (dto.type === 'POO') {
      data.pooColor = dto.pooColor ?? null;
      data.pooConsistency = dto.pooConsistency ?? null;
      data.peeColor = null;
      data.peeFoam = null;
      data.peeVolume = null;
    }
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.record.update({
      where: { id },
      data: data as Prisma.RecordUncheckedUpdateInput,
    });
  }

  async remove(userId: string, id: string) {
    const record = await this.findOwned(userId, id);
    if (record.photoStoragePath) {
      await this.storage.delete(record.photoStoragePath).catch(() => undefined);
    }
    await this.prisma.record.delete({ where: { id } });
    return { success: true };
  }
}
