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

export class Bedrock extends LLM<BaseLanguageModelCallOptions> {
  static lc_name() {
    return "AmazonBedrock";
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

  body: string | Record<string, any>;

  streaming = false;

  client: BedrockRuntimeClient;

  promptPrefix: string;

  promptSuffix: string;

  constructor(fields?: Partial<BedrockInput> & BaseLLMParams) {
    super(fields ?? {});

    this.modelId = fields?.modelId ?? this.modelId;
    this.body = fields?.body ?? "";
    this.streaming = fields?.streaming ?? false;
    this.client = fields?.client ?? new BedrockRuntimeClient();
    this.promptPrefix = fields?.promptPrefix ?? "";
    this.promptSuffix = fields?.promptSuffix ?? "";
  }

  /**
   * Get the parameters used to invoke the model
   */
  invocationParams(options?: this["ParsedCallOptions"]): Omit<
    InvokeModelWithResponseStreamCommandInput,
    "body"
  > &
    Omit<InvokeModelCommandInput, "body"> & {
      body: string | Record<string, any>;
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

    const body = this._createBody(prompt, params);
    const invocationParams: InvokeModelWithResponseStreamCommandInput = {
      ...params,
      body,
    };
    const invokeCommand = new InvokeModelWithResponseStreamCommand(
      invocationParams
    );

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

    for await (const streamPart of stream) {
      if (!streamPart.chunk) {
        continue;
      }

      const generationChunk = new GenerationChunk({
        text: new TextDecoder().decode(streamPart.chunk.bytes),
      });
      yield generationChunk;
      void runManager?.handleLLMNewToken(generationChunk.text ?? "");
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
      const body = this._createBody(prompt, params);
      const invocationParams: InvokeModelWithResponseStreamCommandInput = {
        ...params,
        body,
      };
      const invokeCommand = new InvokeModelCommand(invocationParams);

      const response = await this.client.send(invokeCommand);
      if (
        (response.$metadata?.httpStatusCode ?? 0) < 200 ||
        (response.$metadata?.httpStatusCode ?? 500) >= 300
      ) {
        throw new Error(
          `Error invoking bedrock model: ${response.$metadata.httpStatusCode}`
        );
      }

      return new TextDecoder().decode(response.body);
    }
  }

  _createBody(
    prompt: string,
    params: ReturnType<typeof this.invocationParams>
  ) {
    let body:
      | InvokeModelCommandInput["body"]
      | InvokeModelWithResponseStreamCommandInput["body"];
    if (this.modelId === "amazon.titan-text-express-v1") {
      body = JSON.stringify({
        inputText: `${this.promptPrefix}${prompt}${this.promptSuffix}`,
        ...JSON.parse(params.body.toString()),
      });
    } else {
      body = JSON.stringify({
        prompt: `${this.promptPrefix}${prompt}${this.promptSuffix}`,
        ...JSON.parse(JSON.stringify(params.body)),
      });
    }

    return body;
  }

  _llmType() {
    return "amazon-bedrock";
  }
}
