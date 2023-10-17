import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  type InvokeModelCommandInput,
  type InvokeModelWithResponseStreamCommandInput,
} from "@aws-sdk/client-bedrock-runtime";
import type { BaseLanguageModelCallOptions } from "langchain/base_language";
import type { CallbackManagerForLLMRun } from "langchain/callbacks";
import { LLM, type BaseLLMParams } from "langchain/llms/base";
import { GenerationChunk } from "langchain/schema";
import type { BedrockInput } from "../types/bedrock-types";

export class RAIBedrock extends LLM<BaseLanguageModelCallOptions> {
  static lc_name() {
    return "RAIBedrock";
  }

  get callKeys() {
    return [...super.callKeys, "options"];
  }

  lc_serializable = true;

  get lc_secrets(): { [key: string]: string } | undefined {
    return {};
  }

  get lc_aliases(): Record<string, string> {
    return {
      modelName: "model",
    };
  }

  modelId = "amazon.titan-text-express-v1";

  private provider: string;

  body: Record<string, any>;

  streaming = false;

  client: BedrockRuntimeClient;

  constructor(fields?: Partial<BedrockInput> & BaseLLMParams) {
    super(fields ?? {});

    this.modelId = fields?.modelId ?? this.modelId;
    this.provider = this.modelId.split(".")[0];

    this.body = fields?.body ?? {};
    this.streaming = fields?.stream ?? false;
    this.client = fields?.client ?? new BedrockRuntimeClient();
  }

  _log(message: any, ...optionalParams: any[]) {
    if (this.verbose) {
      console.log(`[RAIBedrock] ${message}`, ...optionalParams);
    }
  }

  /**
   * Get the parameters used to invoke the model
   */
  invocationParams(options?: this["ParsedCallOptions"]): Omit<
    InvokeModelWithResponseStreamCommandInput,
    "body"
  > &
    Omit<InvokeModelCommandInput, "body"> & {
      body: Record<string, any>;
    } {
    return {
      modelId: this.modelId,
      body: this.body,
      accept: "*/*",
      contentType: "application/json",
    };
  }

  async *_streamResponseChunks(
    prompt: string,
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): AsyncGenerator<GenerationChunk> {
    const params = this.invocationParams(options);

    const body = this._createRequestBody(prompt, params);
    const invokeCommand = new InvokeModelWithResponseStreamCommand({
      ...params,
      body,
    });

    this._log("Invoking bedrock model with params:", invokeCommand.input);
    const response = await this.client.send(invokeCommand);
    if (
      (response.$metadata?.httpStatusCode ?? 0) < 200 ||
      (response.$metadata?.httpStatusCode ?? 500) >= 300
    ) {
      throw new Error(
        `Error invoking bedrock model: ${response.$metadata.httpStatusCode}`
      );
    }

    const stream = response.body;
    if (!stream) {
      throw new Error("No stream returned from bedrock invocation");
    }

    const decoder = new TextDecoder();
    for await (const streamPart of stream) {
      if (!streamPart.chunk) {
        continue;
      }

      const responseBody = decoder.decode(streamPart.chunk.bytes);
      const text = this._extractOutputFromResponseBody(responseBody);
      const generationChunk = new GenerationChunk({
        text,
      });
      yield generationChunk;
      void runManager?.handleLLMNewToken(generationChunk.text);
    }
    if (options.signal?.aborted) {
      throw new Error("AbortError");
    }
  }

  /** @ignore */
  async _call(
    prompt: string,
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): Promise<string> {
    const params = this.invocationParams(options);

    if (this.streaming) {
      const stream = await this._streamResponseChunks(
        prompt,
        options,
        runManager
      );
      let finalChunk: GenerationChunk | undefined;
      for await (const chunk of stream) {
        if (finalChunk === undefined) {
          finalChunk = chunk;
        } else {
          finalChunk = finalChunk.concat(chunk);
        }
      }
      return finalChunk?.text ?? "";
    } else {
      const body = this._createRequestBody(prompt, params);
      const invokeCommand = new InvokeModelCommand({
        ...params,
        body,
      });

      this._log("Invoking bedrock model with params:", invokeCommand.input);
      const response = await this.client.send(invokeCommand);
      if (
        (response.$metadata?.httpStatusCode ?? 0) < 200 ||
        (response.$metadata?.httpStatusCode ?? 500) >= 300
      ) {
        throw new Error(
          `Error invoking bedrock model: ${response.$metadata.httpStatusCode}`
        );
      }

      const responseBody = new TextDecoder().decode(response.body);
      return this._extractOutputFromResponseBody(responseBody);
    }
  }

  _createRequestBody(
    prompt: string,
    params: ReturnType<typeof this.invocationParams>
  ):
    | InvokeModelCommandInput["body"]
    | InvokeModelWithResponseStreamCommandInput["body"] {
    let body:
      | InvokeModelCommandInput["body"]
      | InvokeModelWithResponseStreamCommandInput["body"];
    if (this.provider === "amazon") {
      body = JSON.stringify({
        ...params.body,
        inputText: prompt,
      });
    } else if (this.provider === "cohere") {
      body = JSON.stringify({
        ...params.body,
        stream: this.streaming,
        prompt,
      });
    } else if (this.provider === "anthropic") {
      body = JSON.stringify({
        ...params.body,
        stop_sequences: ["\n\nHuman:", ...(params.body.stop_sequences ?? [])],
        prompt: `\n\nHuman: ${prompt}\n\nAssistant: `,
      });
    } else {
      throw new Error(`Unknown provider: ${this.provider}`);
    }

    this._log("Created bedrock invoke body:", body);
    return body;
  }

  _extractOutputFromResponseBody(response: string): string {
    this._log("Extracting output from bedrock response:", response);
    if (this.provider === "amazon") {
      return JSON.parse(response).outputText;
    } else if (this.provider === "cohere") {
      if (this.streaming) {
        const text = JSON.parse(response).text;
        if (!text || text === "<EOS_TOKEN>") {
          return "";
        }
        return text;
      } else {
        return JSON.parse(response).generations[0].text;
      }
    } else if (this.provider === "anthropic") {
      return JSON.parse(response).completion;
    } else {
      throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  _llmType() {
    return "rai-amazon-bedrock";
  }
}
