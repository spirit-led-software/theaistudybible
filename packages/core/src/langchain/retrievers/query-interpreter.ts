import type { CallbackManagerForRetrieverRun } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import type { Document } from "langchain/document";
import type { BaseLLMCallOptions, LLM } from "langchain/llms/base";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import {
  BaseRetriever,
  type BaseRetrieverInput,
} from "langchain/schema/retriever";
import { z } from "zod";

export const QUERY_INTERPRETER_DEFAULT_PROMPT_TEMPLATE = `Given the user query below, the you need to generate {numSearchTerms} unique search terms or phrases to effectively retrieve relevant documents. The objective is to capture the user's intent and provide accurate and diverse results. Please consider the following guidelines:

1. **Understand User Intent:**
   - Analyze the user's query to discern the underlying intent or information sought.

2. **Query Expansion:**
   - Expand the user query by identifying key concepts, entities, or related terms that may enhance the search.

3. **Contextual Considerations:**
   - Take into account the context of the user query and generate terms that align with the specific domain or topic.

4. **Variability Handling:**
   - Address variability in user queries by considering synonymous expressions, alternative phrasings, or potential variations.

5. **Relevance Focus:**
   - Prioritize generating terms that are likely to lead to highly relevant documents in the vector database.

6. **Diversity in Results:**
   - Aim for diversity in generated search terms to ensure a broad representation of potential document matches.

7. **Consider Query Length:**
   - Be mindful of the optimal length of generated search terms, balancing informativeness and conciseness.

The user's query is within <query></query> XML tags.
The formatting instructions are within <format_instructions></format_instructions> XML tags. **IMPORTANT:** You must follow these instructions exactly when generating your response.

<query>
{query}
</query>

<format_instructions>
{formatInstructions}
</format_instructions>`;

export type QueryInterpreterInput = BaseRetrieverInput & {
  llm: LLM;

  /**
   * The base retriever to use for the query interpreter.
   * The number k you provide will be multiplicative (i.e. if you supply 4 search terms and k=3, then the query interpreter retriever will retrieve 12 documents).
   */
  baseRetriever: BaseRetriever;

  /**
   * The number of search terms to generate.
   */
  numSearchTerms?: number;

  /**
   * The prompt template to use for the query interpreter.
   * If not provided, then the default prompt template will be used.
   */
  prompt?: PromptTemplate;

  /**
   * The desired length of the search terms.
   * If not provided, then the default prompt template will be used.
   */
  desiredLength?: number;

  /**
   * The padding character to use if the desired length is provided.
   * If not provided, then the default padding character will be used.
   */
  paddingCharacter?: string;
};

/**
 * A retriever that uses a language model to generate search terms or phrases that you would use to find relevant documents from within a vector database.
 * THE RETURNED SOURCE DOCUMENTS LIST MAY CONTAIN DUPLICATES.
 */
export class QueryInterpreterRetriever extends BaseRetriever {
  static lc_name(): string {
    return "QueryInterpreterRetriever";
  }

  lc_namespace = ["langhchain", "retrievers", "query_interpreter"];

  llmChain: LLMChain<Set<string>, LLM<BaseLLMCallOptions>>;

  baseRetriever: BaseRetriever;

  numSearchTerms: number;

  outputParser: StructuredOutputParser<z.ZodArray<z.ZodString>>;

  desiredLength?: number;

  paddingCharacter: string;

  constructor(fields: QueryInterpreterInput) {
    super(fields);
    this.baseRetriever = fields.baseRetriever;
    this.numSearchTerms = fields.numSearchTerms || 4;

    this.outputParser = StructuredOutputParser.fromZodSchema(
      z
        .array(z.string())
        .length(this.numSearchTerms)
        .describe(
          "Search terms or phrases that you would use to find relevant documents."
        )
    );

    this.llmChain = new LLMChain({
      llm: fields.llm,
      prompt:
        fields.prompt ||
        PromptTemplate.fromTemplate(QUERY_INTERPRETER_DEFAULT_PROMPT_TEMPLATE),
      outputKey: "text",
      verbose: fields.verbose,
    });

    this.desiredLength = fields.desiredLength;
    this.paddingCharacter = fields.paddingCharacter || "0";
  }

  async _getRelevantDocuments(
    query: string,
    runManager?: CallbackManagerForRetrieverRun
  ): Promise<Document[]> {
    const searchTermsResult = await this.llmChain.call(
      {
        query,
        numSearchTerms: this.numSearchTerms,
        formatInstructions: this.outputParser.getFormatInstructions(),
      },
      runManager?.getChild()
    );

    const searchTerms = await this.outputParser.parse(searchTermsResult.text);
    searchTerms.push(query); // Add the original query to the search terms.

    const docs = await Promise.all(
      searchTerms.map(async (searchTerm) => {
        let paddedSearchTerm = searchTerm;
        if (this.desiredLength && searchTerm.length < this.desiredLength) {
          paddedSearchTerm = searchTerm.padEnd(this.desiredLength, "0");
        }
        return await this.baseRetriever.getRelevantDocuments(
          paddedSearchTerm,
          runManager?.getChild()
        );
      })
    );

    return docs.flat();
  }
}
