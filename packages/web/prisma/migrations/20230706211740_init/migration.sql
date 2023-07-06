-- DropForeignKey
ALTER TABLE "ChatMessagesOnSourceDocuments" DROP CONSTRAINT "ChatMessagesOnSourceDocuments_messageId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessagesOnSourceDocuments" DROP CONSTRAINT "ChatMessagesOnSourceDocuments_sourceDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "DevosOnSourceDocuments" DROP CONSTRAINT "DevosOnSourceDocuments_devoId_fkey";

-- DropForeignKey
ALTER TABLE "DevosOnSourceDocuments" DROP CONSTRAINT "DevosOnSourceDocuments_sourceDocumentId_fkey";

-- AddForeignKey
ALTER TABLE "ChatMessagesOnSourceDocuments" ADD CONSTRAINT "ChatMessagesOnSourceDocuments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessagesOnSourceDocuments" ADD CONSTRAINT "ChatMessagesOnSourceDocuments_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevosOnSourceDocuments" ADD CONSTRAINT "DevosOnSourceDocuments_devoId_fkey" FOREIGN KEY ("devoId") REFERENCES "Devo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevosOnSourceDocuments" ADD CONSTRAINT "DevosOnSourceDocuments_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
