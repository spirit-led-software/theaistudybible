import { Document } from "langchain/document";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";

export class CustomLLMChainExtractor extends LLMChainExtractor {
  async compressDocuments(
    documents: Document[],
    query: string
  ): Promise<Document[]> {
    const compressedDocs = await Promise.all(
      documents.map(async (doc) => {
        const input = this.getInput(query, doc);
        const output = await this.llmChain.predict(input);
        return output.length > 0
          ? new Document({
              ...doc,
              pageContent: output,
            })
          : undefined;
      })
    );
    return compressedDocs.filter((doc): doc is Document => doc !== undefined);
  }
}
