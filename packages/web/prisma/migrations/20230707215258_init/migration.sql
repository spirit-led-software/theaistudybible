/*
  Warnings:

  - You are about to drop the `Devo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DevosOnSourceDocuments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DevosOnSourceDocuments" DROP CONSTRAINT "DevosOnSourceDocuments_devoId_fkey";

-- DropForeignKey
ALTER TABLE "DevosOnSourceDocuments" DROP CONSTRAINT "DevosOnSourceDocuments_sourceDocumentId_fkey";

-- DropTable
DROP TABLE "Devo";

-- DropTable
DROP TABLE "DevosOnSourceDocuments";

-- CreateTable
CREATE TABLE "Devotion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Devotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevotionsOnSourceDocuments" (
    "devotionId" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,

    CONSTRAINT "DevotionsOnSourceDocuments_pkey" PRIMARY KEY ("devotionId","sourceDocumentId")
);

-- AddForeignKey
ALTER TABLE "DevotionsOnSourceDocuments" ADD CONSTRAINT "DevotionsOnSourceDocuments_devotionId_fkey" FOREIGN KEY ("devotionId") REFERENCES "Devotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevotionsOnSourceDocuments" ADD CONSTRAINT "DevotionsOnSourceDocuments_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
