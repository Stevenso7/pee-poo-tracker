import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure a Profile row exists for a user (created on first authenticated
   * request). Supabase owns the identity; we only mirror a settings row.
   */
  ensureProfile(userId: string) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }
}
