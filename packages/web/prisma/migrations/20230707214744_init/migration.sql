-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiId" TEXT,
    "text" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "UserMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "userMessageId" TEXT,

    CONSTRAINT "AiResponse_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "AiResponsesOnSourceDocuments" (
    "aiResponseId" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,

    CONSTRAINT "AiResponsesOnSourceDocuments_pkey" PRIMARY KEY ("aiResponseId","sourceDocumentId")
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
CREATE INDEX "UserMessage_aiId_text_idx" ON "UserMessage"("aiId", "text");

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_text_key" ON "SourceDocument"("text");

-- CreateIndex
CREATE INDEX "SourceDocument_text_metadata_idx" ON "SourceDocument"("text", "metadata");

-- CreateIndex
CREATE INDEX "IndexOperation_type_status_idx" ON "IndexOperation"("type", "status");

-- AddForeignKey
ALTER TABLE "UserMessage" ADD CONSTRAINT "UserMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiResponse" ADD CONSTRAINT "AiResponse_userMessageId_fkey" FOREIGN KEY ("userMessageId") REFERENCES "UserMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiResponsesOnSourceDocuments" ADD CONSTRAINT "AiResponsesOnSourceDocuments_aiResponseId_fkey" FOREIGN KEY ("aiResponseId") REFERENCES "AiResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiResponsesOnSourceDocuments" ADD CONSTRAINT "AiResponsesOnSourceDocuments_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevosOnSourceDocuments" ADD CONSTRAINT "DevosOnSourceDocuments_devoId_fkey" FOREIGN KEY ("devoId") REFERENCES "Devo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevosOnSourceDocuments" ADD CONSTRAINT "DevosOnSourceDocuments_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
