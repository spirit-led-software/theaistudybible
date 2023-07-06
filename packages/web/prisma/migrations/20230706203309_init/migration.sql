-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('user', 'bot');

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ChatMessageType" NOT NULL,
    "text" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessagesOnSourceDocuments" (
    "messageId" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,

    CONSTRAINT "ChatMessagesOnSourceDocuments_pkey" PRIMARY KEY ("messageId","sourceDocumentId")
);

-- CreateTable
CREATE TABLE "Devo" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Devo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevosOnSourceDocuments" (
    "devoId" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,

    CONSTRAINT "DevosOnSourceDocuments_pkey" PRIMARY KEY ("devoId","sourceDocumentId")
);

-- CreateTable
CREATE TABLE "IndexOperation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "IndexOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chat_name_idx" ON "Chat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_text_key" ON "SourceDocument"("text");

-- CreateIndex
CREATE INDEX "SourceDocument_text_metadata_idx" ON "SourceDocument"("text", "metadata");

-- CreateIndex
CREATE INDEX "IndexOperation_type_status_idx" ON "IndexOperation"("type", "status");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessagesOnSourceDocuments" ADD CONSTRAINT "ChatMessagesOnSourceDocuments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessagesOnSourceDocuments" ADD CONSTRAINT "ChatMessagesOnSourceDocuments_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevosOnSourceDocuments" ADD CONSTRAINT "DevosOnSourceDocuments_devoId_fkey" FOREIGN KEY ("devoId") REFERENCES "Devo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevosOnSourceDocuments" ADD CONSTRAINT "DevosOnSourceDocuments_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
