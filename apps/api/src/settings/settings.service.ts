import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FREE_ANALYSIS_LIMIT } from '@pee-poo/shared';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import type { Profile } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private quotaView(profile: Profile) {
    const month = this.currentMonth();
    const used =
      profile.analysisMonth === month ? profile.analysisUsedThisMonth : 0;
    return {
      limit: FREE_ANALYSIS_LIMIT,
      usedThisMonth: used,
      remaining: Math.max(FREE_ANALYSIS_LIMIT - used, 0),
    };
  }

  private toView(profile: Profile) {
    return {
      language: profile.language,
      reminderEnabled: profile.reminderEnabled,
      reminderTimes: profile.reminderTimes,
      photoRetentionDays: profile.photoRetentionDays,
      plan: profile.plan,
      analysisQuota: this.quotaView(profile),
    };
  }

  async get(userId: string) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return this.toView(profile);
  }

  async update(userId: string, dto: UpdateSettingsDto) {
    const data: Record<string, unknown> = {};
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.reminderEnabled !== undefined)
      data.reminderEnabled = dto.reminderEnabled;
    if (dto.reminderTimes !== undefined)
      data.reminderTimes = dto.reminderTimes;
    if (dto.photoRetentionDays !== undefined)
      data.photoRetentionDays = dto.photoRetentionDays;

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: data as Prisma.ProfileUncheckedUpdateInput,
    });
    return this.toView(profile);
  }
}
