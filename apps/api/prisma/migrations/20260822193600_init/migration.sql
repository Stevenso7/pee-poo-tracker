-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('PEE', 'POO');

-- CreateEnum
CREATE TYPE "PeeColor" AS ENUM ('TRANSPARENT', 'PALE_YELLOW', 'YELLOW', 'DARK_YELLOW', 'AMBER', 'BROWN', 'RED_PINK', 'BLUE_GREEN', 'CLOUDY');

-- CreateEnum
CREATE TYPE "PeeFoam" AS ENUM ('NONE', 'SLIGHT', 'MODERATE', 'HEAVY');

-- CreateEnum
CREATE TYPE "PeeVolume" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "PooColor" AS ENUM ('BROWN', 'DARK_BROWN', 'YELLOW', 'GREEN', 'BLACK', 'RED', 'PALE_CLAY', 'GREY');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PREMIUM');

-- CreateTable
CREATE TABLE "profiles" (
    "userId" UUID NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'yue',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoRetentionDays" INTEGER NOT NULL DEFAULT 14,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "analysisUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "analysisMonth" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "records" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "RecordType" NOT NULL,
    "recordedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peeColor" "PeeColor",
    "peeFoam" "PeeFoam",
    "peeVolume" "PeeVolume",
    "pooColor" "PooColor",
    "pooConsistency" INTEGER,
    "notes" TEXT,
    "photoStoragePath" TEXT,
    "photoContentType" TEXT,
    "photoSizeBytes" INTEGER,
    "photoUploadedAt" TIMESTAMPTZ(6),

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" UUID NOT NULL,
    "recordId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "inputSnapshot" JSONB,
    "reportJson" JSONB,
    "reportText" TEXT,
    "disclaimer" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "records_userId_recordedAt_idx" ON "records"("userId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "analyses_recordId_key" ON "analyses"("recordId");

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Safety-net constraints (also enforced at the API level; Prisma does not manage CHECKs)
ALTER TABLE "records" ADD CONSTRAINT "records_pooConsistency_check" CHECK ("pooConsistency" BETWEEN 1 AND 7);
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_photoRetentionDays_check" CHECK ("photoRetentionDays" BETWEEN 1 AND 90);
