-- CreateTable
CREATE TABLE "batch_analyses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "RecordType" NOT NULL,
    "days" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "inputSnapshot" JSONB,
    "reportJson" JSONB,
    "reportText" TEXT,
    "disclaimer" TEXT,
    "recordCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "batch_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "batch_analyses_userId_createdAt_idx" ON "batch_analyses"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "batch_analyses" ADD CONSTRAINT "batch_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
