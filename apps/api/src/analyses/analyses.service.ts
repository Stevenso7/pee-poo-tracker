import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { GeminiService } from './gemini.service';
import {
  AnalysisReportSchema,
  FREE_ANALYSIS_LIMIT,
  PEE_COLOR_LABELS,
  PEE_FOAM_LABELS,
  PEE_VOLUME_LABELS,
  POO_COLOR_LABELS,
  RECORD_TYPE_LABELS,
} from '@pee-poo/shared';
import type { Record as RecordModel } from '@prisma/client';

@Injectable()
export class AnalysesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly gemini: GeminiService,
  ) {}

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private buildFormText(record: RecordModel): string {
    const lines = [`類型：${RECORD_TYPE_LABELS[record.type]}`];
    lines.push(`時間：${record.recordedAt.toISOString()}`);

    if (record.type === 'PEE') {
      if (record.peeColor)
        lines.push(`顏色：${PEE_COLOR_LABELS[record.peeColor] ?? record.peeColor}`);
      if (record.peeFoam)
        lines.push(`泡泡：${PEE_FOAM_LABELS[record.peeFoam] ?? record.peeFoam}`);
      if (record.peeVolume)
        lines.push(`量：${PEE_VOLUME_LABELS[record.peeVolume] ?? record.peeVolume}`);
    } else {
      if (record.pooColor)
        lines.push(`顏色：${POO_COLOR_LABELS[record.pooColor] ?? record.pooColor}`);
      if (record.pooConsistency)
        lines.push(`質地（Bristol）：${record.pooConsistency}`);
    }

    if (record.notes) lines.push(`備註：${record.notes}`);
    return lines.join('\n');
  }

  private quotaView(profile: {
    plan: string;
    analysisUsedThisMonth: number;
    analysisMonth: string;
  }) {
    const month = this.currentMonth();
    const used =
      profile.analysisMonth === month ? profile.analysisUsedThisMonth : 0;
    return {
      limit: FREE_ANALYSIS_LIMIT,
      usedThisMonth: used,
      remaining: Math.max(FREE_ANALYSIS_LIMIT - used, 0),
    };
  }

  async getCached(userId: string, recordId: string) {
    const analysis = await this.prisma.analysis.findFirst({
      where: { recordId, userId },
    });
    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }
    return { analysis };
  }

  async analyze(userId: string, recordId: string, force: boolean) {
    const record = await this.prisma.record.findFirst({
      where: { id: recordId, userId },
      include: { analysis: true },
    });
    if (!record) {
      throw new NotFoundException('Record not found');
    }
    if (!record.photoStoragePath) {
      throw new BadRequestException('請先上載相片');
    }

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Cached return is free.
    if (!force && record.analysis?.status === 'COMPLETED') {
      return { analysis: record.analysis, quota: this.quotaView(profile) };
    }

    // Quota check (FREE plan).
    const month = this.currentMonth();
    const used =
      profile.analysisMonth === month ? profile.analysisUsedThisMonth : 0;
    if (profile.plan === 'FREE' && used >= FREE_ANALYSIS_LIMIT) {
      throw new HttpException(
        '今個月嘅免費分析次數用晒喇',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const analysis = await this.prisma.analysis.upsert({
      where: { recordId },
      create: {
        recordId,
        userId,
        model: this.gemini.modelName,
        status: 'PENDING',
      },
      update: { status: 'PENDING', model: this.gemini.modelName },
    });

    try {
      const { data: blob, contentType } = await this.storage.download(
        record.photoStoragePath,
      );
      const arrayBuffer = await blob.arrayBuffer();
      const imageBase64 = Buffer.from(arrayBuffer).toString('base64');
      const formText = this.buildFormText(record);

      const raw = await this.gemini.analyzeImage({
        imageBase64,
        mimeType: contentType || 'image/jpeg',
        formText,
      });

      const report = AnalysisReportSchema.parse(raw);

      const updated = await this.prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'COMPLETED',
          reportJson: report as any,
          reportText: report.summary,
          disclaimer: report.disclaimer,
          inputSnapshot: { formText, promptVersion: 1 } as any,
          completedAt: new Date(),
        },
      });

      const updatedProfile = await this.prisma.profile.update({
        where: { userId },
        data: { analysisUsedThisMonth: used + 1, analysisMonth: month },
      });

      return { analysis: updated, quota: this.quotaView(updatedProfile) };
    } catch (err) {
      await this.prisma.analysis
        .update({
          where: { id: analysis.id },
          data: { status: 'FAILED', completedAt: new Date() },
        })
        .catch(() => undefined);

      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('分析失敗，請再試一次');
    }
  }
}
