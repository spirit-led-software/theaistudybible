import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Embeddings, type EmbeddingsParams } from 'langchain/embeddings/base';
import type { CredentialType } from '../util/bedrock';

export type BedrockEmbeddingProvider = 'amazon' | 'cohere';

export type AmazonEmbeddingModel = 'amazon.titan-embed-text-v1';

export type CohereEmbeddingModel = 'cohere.embed-english-v3' | 'cohere.embed-multilingual-v3';

export type BedrockEmbeddingModel = AmazonEmbeddingModel | CohereEmbeddingModel;

export type CohereEmbeddingInputType =
  | 'search_document'
  | 'search_query'
  | 'classification'
  | 'clustering';

export type CohereEmbeddingTruncateSetting = 'NONE' | 'LEFT' | 'RIGHT';

/**
 * Interface that extends EmbeddingsParams and defines additional
 * parameters specific to the BedrockEmbeddings class.
 */
export type RAIBedrockEmbeddingsParams = EmbeddingsParams & {
  verbose?: boolean;
  /**
   * A client provided by the user that allows them to customze any
   * SDK configuration options.
   */
  client?: BedrockRuntimeClient;

  region?: string;

  credentials?: CredentialType;
} & (
    | {
        model?: CohereEmbeddingModel;

        inputType?: CohereEmbeddingInputType;

        truncate?: CohereEmbeddingTruncateSetting;
      }
    | {
        model?: AmazonEmbeddingModel;
      }
  );

/**
 * Class that extends the Embeddings class and provides methods for
 * generating embeddings using the Bedrock API.
 */
export class RAIBedrockEmbeddings extends Embeddings {
  model: BedrockEmbeddingModel;
  provider: BedrockEmbeddingProvider;

  inputType?: CohereEmbeddingInputType;
  truncate?: CohereEmbeddingTruncateSetting;

  client: BedrockRuntimeClient;

  verbose: boolean;

  constructor(fields?: RAIBedrockEmbeddingsParams) {
    super(fields ?? {});

    this.model = fields?.model ?? 'amazon.titan-embed-text-v1';
    this.provider = this.model.split('.')[0] as BedrockEmbeddingProvider;

    // @ts-expect-error Explicitly checking for CohereEmbeddingModel
    this.inputType = fields?.inputType;

    // @ts-expect-error Explicitly checking for CohereEmbeddingModel
    this.truncate = fields?.truncate;

    this.client =
      fields?.client ??
      new BedrockRuntimeClient({
        region: fields?.region,
        credentials: fields?.credentials
      });

    this.verbose = fields?.verbose ?? false;
  }

  private _log(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(`[RAIBedrockEmbeddings] ${message}`, ...args);
    }
  }

  protected _createBody(texts: string[]): string {
    this._log('Creating body for texts:', texts);
    // replace newlines, which can negatively affect performance.
    const cleanedTexts = texts.map((text) => text.replace(/\n/g, ' '));
    if (this.provider === 'cohere') {
      this._log('Creating body for Cohere');
      return JSON.stringify({
        texts: cleanedTexts,
        input_type: this.inputType ?? 'search_query',
        truncate: this.truncate ?? 'NONE'
      });
    } else if (this.provider === 'amazon') {
      this._log('Creating body for Amazon');
      if (cleanedTexts.length > 1) {
        throw new Error('Amazon embeddings only supports one text at a time');
      }
      return JSON.stringify({
        inputText: cleanedTexts[0]
      });
    } else {
      throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  protected _getEmbeddingsFromResponseBody(response: string): number[][] {
    if (this.provider === 'cohere') {
      const embeddings = JSON.parse(response).embeddings as number[][];
      return embeddings;
    } else if (this.provider === 'amazon') {
      const embedding = JSON.parse(response).embedding as number[];
      return [embedding];
    } else {
      throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  /**
   * Protected method to make a request to the Bedrock API to generate
   * embeddings. Handles the retry logic and returns the response from the
   * API.
   * @param request Request to send to the Bedrock API.
   * @returns Promise that resolves to the response from the API.
   */
  protected async _embedTexts(text: string[]): Promise<number[][]> {
    this._log('Embedding texts:', text);
    return this.caller.call(async () => {
      try {
        this._log('Sending request to Bedrock API');
        const res = await this.client.send(
          new InvokeModelCommand({
            modelId: this.model,
            body: this._createBody(text),
            contentType: 'application/json',
            accept: 'application/json'
          })
        );
        this._log('Received response from Bedrock API:', res);
        const body = res.body.transformToString();
        this._log('Response body:', body);
        return this._getEmbeddingsFromResponseBody(body);
      } catch (e) {
        console.error({
          error: e
        });
        if (e instanceof Error) {
          throw new Error(`An error occurred while embedding documents with Bedrock: ${e.message}`);
        }
        throw new Error('An error occurred while embedding documents with Bedrock');
      }
    });
  }

  /**
   * Method that takes a document as input and returns a promise that
   * resolves to an embedding for the document. It calls the _embedText
   * method with the document as the input.
   * @param document Document for which to generate an embedding.
   * @returns Promise that resolves to an embedding for the input document.
   */
  async embedQuery(document: string): Promise<number[]> {
    this._log('Embedding document:', document);
    const embeddings = await this.caller.callWithOptions({}, this._embedTexts.bind(this), [
      document
    ]);
    this._log('Embeddings generated:', embeddings);
    return embeddings[0];
  }

  /**
   * Method to generate embeddings for an array of texts. Calls _embedText
   * method which batches and handles retry logic when calling the AWS Bedrock API.
   * @param documents Array of texts for which to generate embeddings.
   * @returns Promise that resolves to a 2D array of embeddings for each input document.
   */
  async embedDocuments(documents: string[]): Promise<number[][]> {
    this._log('Embedding documents:', documents);
    if (this.provider === 'amazon') {
      this._log('Embedding documents with Amazon');
      const chunkSize = 5;
      const chunks: number[][][] = [];
      for (let i = 0; i < documents.length; i += chunkSize) {
        const chunk = documents.slice(i, i + chunkSize);
        this._log('Embedding chunk of length:', chunk.length);
        const embeddings = await Promise.all(
          chunk.map(async (document) => {
            return await this._embedTexts([document]);
          })
        );
        chunks.push(embeddings.flat());
      }
      return chunks.flat();
    } else if (this.provider === 'cohere') {
      this._log('Embedding documents with Cohere');
      const chunkSize = 96; // max documents allowed by cohere API
      const chunks: Promise<number[][]>[] = [];
      for (let i = 0; i < documents.length; i += chunkSize) {
        const chunk = documents.slice(i, i + chunkSize);
        this._log('Embedding chunk of length:', chunk.length);
        chunks.push(this.caller.callWithOptions({}, this._embedTexts.bind(this), chunk));
      }
      const embeddings = await Promise.all(chunks);
      return embeddings.flat();
    } else {
      throw new Error(`Unknown provider: ${this.provider}`);
    }
  }
}
