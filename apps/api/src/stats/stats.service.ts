import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const records = await this.prisma.record.findMany({
      where: { userId, recordedAt: { gte: fromDate, lte: toDate } },
      select: { type: true, recordedAt: true, peeColor: true, pooConsistency: true },
    });

    const dailyMap = new Map<
      string,
      { date: string; peeCount: number; pooCount: number }
    >();
    let peeCount = 0;
    let pooCount = 0;
    const peeColorCounts = new Map<string, number>();
    const pooConsistencyCounts = new Map<number, number>();

    for (const r of records) {
      const date = r.recordedAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(date) ?? { date, peeCount: 0, pooCount: 0 };

      if (r.type === 'PEE') {
        entry.peeCount += 1;
        peeCount += 1;
        if (r.peeColor) {
          peeColorCounts.set(r.peeColor, (peeColorCounts.get(r.peeColor) ?? 0) + 1);
        }
      } else {
        entry.pooCount += 1;
        pooCount += 1;
        if (r.pooConsistency != null) {
          pooConsistencyCounts.set(
            r.pooConsistency,
            (pooConsistencyCounts.get(r.pooConsistency) ?? 0) + 1,
          );
        }
      }

      dailyMap.set(date, entry);
    }

    const daily = [...dailyMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const days = daily.length || 1;

    const mostCommon = <T>(map: Map<T, number>): T | null => {
      let best: T | null = null;
      let bestN = -1;
      for (const [key, n] of map) {
        if (n > bestN) {
          best = key;
          bestN = n;
        }
      }
      return best;
    };

    return {
      from,
      to,
      daily,
      totals: { peeCount, pooCount },
      avgPerDay: {
        pee: Number((peeCount / days).toFixed(1)),
        poo: Number((pooCount / days).toFixed(1)),
      },
      mostCommonPeeColor: mostCommon(peeColorCounts),
      mostCommonPooConsistency: mostCommon(pooConsistencyCounts),
    };
  }
}
