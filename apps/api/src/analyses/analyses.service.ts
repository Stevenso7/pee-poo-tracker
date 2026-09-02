import {
	BadRequestException,
	HttpException,
	HttpStatus,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { GeminiService } from "./gemini.service";
import {
	AnalysisReportSchema,
	FREE_ANALYSIS_LIMIT,
	PEE_COLOR_LABELS,
	PEE_FOAM_LABELS,
	PEE_VOLUME_LABELS,
	POO_COLOR_LABELS,
	RECORD_TYPE_LABELS,
} from "@pee-poo/shared";
import type { Record as RecordModel } from "@prisma/client";

@Injectable()
export class AnalysesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly storage: StorageService,
		private readonly gemini: GeminiService,
	) {}

	private currentMonth(): string {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	}

	private buildFormText(record: RecordModel): string {
		const lines = [`類型：${RECORD_TYPE_LABELS[record.type]}`];
		lines.push(`時間：${record.recordedAt.toISOString()}`);

		if (record.type === "PEE") {
			if (record.peeColor)
				lines.push(
					`顏色：${PEE_COLOR_LABELS[record.peeColor] ?? record.peeColor}`,
				);
			if (record.peeFoam)
				lines.push(
					`泡泡：${PEE_FOAM_LABELS[record.peeFoam] ?? record.peeFoam}`,
				);
			if (record.peeVolume)
				lines.push(
					`量：${PEE_VOLUME_LABELS[record.peeVolume] ?? record.peeVolume}`,
				);
		} else {
			if (record.pooColor)
				lines.push(
					`顏色：${POO_COLOR_LABELS[record.pooColor] ?? record.pooColor}`,
				);
			if (record.pooConsistency)
				lines.push(`質地（Bristol）：${record.pooConsistency}`);
		}

		if (record.notes) lines.push(`備註：${record.notes}`);
		return lines.join("\n");
	}

	private buildBatchFormText(records: RecordModel[]): string {
		if (records.length === 0) return "該時段無記錄";
		const lines = [`共 ${records.length} 次記錄：`];
		for (const r of records) {
			lines.push(`\n--- ${r.recordedAt.toLocaleString("zh-HK")} ---`);
			lines.push(this.buildFormText(r));
		}
		return lines.join("\n");
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
			throw new NotFoundException("Analysis not found");
		}
		return { analysis };
	}

	async analyze(userId: string, recordId: string, force: boolean) {
		const record = await this.prisma.record.findFirst({
			where: { id: recordId, userId },
			include: { analysis: true },
		});
		if (!record) {
			throw new NotFoundException("Record not found");
		}
		if (!record.photoStoragePath) {
			throw new BadRequestException("請先上載相片");
		}

		const profile = await this.prisma.profile.upsert({
			where: { userId },
			create: { userId },
			update: {},
		});

		// Cached return is free.
		if (!force && record.analysis?.status === "COMPLETED") {
			return { analysis: record.analysis, quota: this.quotaView(profile) };
		}

		// Quota check (FREE plan).
		const month = this.currentMonth();
		const used =
			profile.analysisMonth === month ? profile.analysisUsedThisMonth : 0;
		if (profile.plan === "FREE" && used >= FREE_ANALYSIS_LIMIT) {
			throw new HttpException(
				"今個月嘅免費分析次數用晒喇",
				HttpStatus.TOO_MANY_REQUESTS,
			);
		}

const analysis = await this.prisma.analysis.upsert({
      where: { recordId },
      create: {
        recordId,
        userId,
        model: this.gemini.model,
        status: 'PENDING',
      },
      update: { status: 'PENDING', model: this.gemini.model },
    });

		try {
			const { data: blob, contentType } = await this.storage.download(
				record.photoStoragePath,
			);
			const arrayBuffer = await blob.arrayBuffer();
			const imageBase64 = Buffer.from(arrayBuffer).toString("base64");
			const formText = this.buildFormText(record);

			const raw = await this.gemini.analyzeImage({
				imageBase64,
				mimeType: contentType || "image/jpeg",
				formText,
			});

			const report = AnalysisReportSchema.parse(raw);

			const updated = await this.prisma.analysis.update({
				where: { id: analysis.id },
				data: {
					status: "COMPLETED",
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
					data: { status: "FAILED", completedAt: new Date() },
				})
				.catch(() => undefined);

			if (err instanceof HttpException) {
				throw err;
			}
			throw new InternalServerErrorException("分析失敗，請再試一次");
		}
	}

	async batchAnalyze(
		userId: string,
		type: "PEE" | "POO",
		days: number,
		force: boolean,
	) {
		const since = new Date();
		since.setDate(since.getDate() - days + 1);
		since.setHours(0, 0, 0, 0);

		const records = await this.prisma.record.findMany({
			where: {
				userId,
				type,
				recordedAt: { gte: since },
			},
			orderBy: { recordedAt: "desc" },
		});

		if (records.length === 0) {
			throw new BadRequestException("該時段無記錄");
		}

		const profile = await this.prisma.profile.upsert({
			where: { userId },
			create: { userId },
			update: {},
		});

		const month = this.currentMonth();
		const used =
			profile.analysisMonth === month ? profile.analysisUsedThisMonth : 0;
		if (profile.plan === "FREE" && used >= FREE_ANALYSIS_LIMIT) {
			throw new HttpException(
				"今個月嘅免費分析次數用晒喇",
				HttpStatus.TOO_MANY_REQUESTS,
			);
		}

		const recordIds = records.map((r) => r.id);
		const existing = await this.prisma.analysis.findMany({
			where: { recordId: { in: recordIds } },
		});

		const toAnalyze = force
			? records
			: records.filter(
					(r) =>
						!existing.find(
							(a) => a.recordId === r.id && a.status === "COMPLETED",
						),
				);

		if (toAnalyze.length === 0) {
			const cached = await this.prisma.analysis.findMany({
				where: { recordId: { in: recordIds } },
			});
			return {
				analyses: cached,
				newCount: 0,
				totalCount: records.length,
				quota: this.quotaView(profile),
			};
		}

		const needed = toAnalyze.length;
		if (profile.plan === "FREE" && used + needed > FREE_ANALYSIS_LIMIT) {
			throw new HttpException(
				`需要 ${needed} 次分析，但本月剩餘 ${FREE_ANALYSIS_LIMIT - used} 次`,
				HttpStatus.TOO_MANY_REQUESTS,
			);
		}

		const results: any[] = [];
		const failed: { recordId: string; error: string }[] = [];
		let newUsed = used;

		for (const record of toAnalyze) {
			try {
				let analysis = await this.prisma.analysis.findFirst({
					where: { recordId: record.id },
				});

if (!analysis) {
analysis = await this.prisma.analysis.create({
            data: {
              recordId: record.id,
              userId,
              model: this.gemini.model,
              status: 'PENDING',
            },
          });
        } else {
analysis = await this.prisma.analysis.update({
            where: { id: analysis.id },
            data: { status: 'PENDING', model: this.gemini.model },
          });
        }

				const formText = this.buildFormText(record);
				let report: any;

				if (record.photoStoragePath) {
					const { data: blob, contentType } = await this.storage.download(
						record.photoStoragePath,
					);
					const arrayBuffer = await blob.arrayBuffer();
					const imageBase64 = Buffer.from(arrayBuffer).toString("base64");
					const raw = await this.gemini.analyzeImage({
						imageBase64,
						mimeType: record.photoContentType || "image/jpeg",
						formText,
					});
					report = AnalysisReportSchema.parse(raw);
				} else {
					const raw = await this.gemini.analyzeText(formText);
					report = AnalysisReportSchema.parse(raw);
				}

				const updated = await this.prisma.analysis.update({
					where: { id: analysis.id },
					data: {
						status: "COMPLETED",
						reportJson: report as any,
						reportText: report.summary,
						disclaimer: report.disclaimer,
						inputSnapshot: { formText, promptVersion: 1 } as any,
						completedAt: new Date(),
					},
				});

				results.push(updated);
				newUsed++;
			} catch (err) {
				console.error(`Analysis failed for ${record.id}:`, err);
				failed.push({
					recordId: record.id,
					error: err instanceof Error ? err.message : String(err),
				});
				// Continue with other records
			}
		}

		const updatedProfile = await this.prisma.profile.update({
			where: { userId },
			data: {
				analysisUsedThisMonth: newUsed,
				analysisMonth: this.currentMonth(),
			},
		});

		return {
			analyses: results,
			newCount: results.length,
			totalCount: records.length,
			failed,
			failedCount: failed.length,
			quota: this.quotaView(updatedProfile),
		};
	}

	async getUserAnalyses(
		userId: string,
		options: { limit?: number; offset?: number } = {},
	) {
		const { limit = 20, offset = 0 } = options;

		const [analyses, total] = await Promise.all([
			this.prisma.analysis.findMany({
				where: {
					record: { userId },
					status: 'COMPLETED',
				},
				include: {
					record: {
						select: {
							id: true,
							type: true,
							recordedAt: true,
							photoStoragePath: true,
						},
					},
				},
				orderBy: { completedAt: 'desc' },
				take: limit,
				skip: offset,
			}),
			this.prisma.analysis.count({
				where: {
					record: { userId },
					status: 'COMPLETED',
				},
			}),
		]);

		// Filter out analyses with invalid record IDs
		const validAnalyses = analyses.filter((a) =>
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.record?.id ?? ''),
		);

		return {
			analyses: validAnalyses,
			total,
			hasMore: offset + validAnalyses.length < total,
		};
	}
}
