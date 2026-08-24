import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, from: string, to: string, tzOffsetMinutes = 0) {
    // from/to are calendar dates in the user's timezone; tzOffsetMinutes is the
    // offset to ADD to UTC to get local time (e.g. 480 for UTC+8).
    const offsetMs = tzOffsetMinutes * 60_000;
    const fromDate = new Date(Date.parse(`${from}T00:00:00Z`) - offsetMs);
    const toDate = new Date(Date.parse(`${to}T00:00:00Z`) - offsetMs + 86_400_000);

    const records = await this.prisma.record.findMany({
      where: { userId, recordedAt: { gte: fromDate, lt: toDate } },
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
      const date = new Date(r.recordedAt.getTime() + offsetMs)
        .toISOString()
        .slice(0, 10);
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
