import type { BaseLanguageModel } from "langchain/base_language";
import {
  BaseChain,
  LLMRouterChain,
  MultiRouteChain,
  type LLMRouterChainInput,
  type MultiRouteChainInput,
} from "langchain/chains";
import { RouterOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import type { BaseChatMessageHistory } from "langchain/schema";
import { z } from "zod";

const ROUTER_TEMPLATE = (
  formatting: string,
  historyString: string = ""
) => `Given a query to a question answering system and the conversation history, select the system best suited for the input. You will be given the names of the available systems and a description of what questions the system is best suited for. The formatting must match the the following instructions exactly.

The formatting instructions are within <format_instructions></format_instructions> XML tags.
The candidate systems are within <candidates></candidates> XML tags. **IMPORTANT:** The candidates are in the format of "[name]: [description]" where [name] is the name of the question answering system and [description] is a description of what questions the system is best suited for. Only the name of the system should be returned.
The conversation history is within <conversation_history></conversation_history> XML tags. This can be empty.
The input is within <input></input> XML tags. **IMPORTANT:** You can and should modify this input, if necessary, to form a standalone query that the question answering system can understand without needing the conversation history.

<format_instructions>
${formatting}
</format_instructions>

<candidates>
{destinations}
</candidates>

<conversation_history>
${historyString}
</conversation_history>

<input>
{{input}}
</input>

Put your output matching the formatting instructions within <output></output> XML tags.`;

export type DestinationChainsInfo = {
  [name in string]: {
    chain: BaseChain;
    description: string;
  };
};

export type DefaultChain = keyof DestinationChainsInfo;

export class RAIChatMultiRouteChain extends MultiRouteChain {
  get outputKeys(): string[] {
    return ["result"];
  }

  static async fromLLMAndChains(
    llm: BaseLanguageModel,
    {
      multiRouteChainOpts,
      routerChainOpts,
      destinationChainsInfo,
      defaultChain,
    }: {
      multiRouteChainOpts?: Partial<MultiRouteChainInput>;
      routerChainOpts?: Partial<LLMRouterChainInput> & {
        history?: BaseChatMessageHistory;
      };
      destinationChainsInfo: DestinationChainsInfo;
      defaultChain: DefaultChain;
    }
  ): Promise<RAIChatMultiRouteChain> {
    const destinations = Object.entries(destinationChainsInfo).map(
      ([name, { description }]) => `${name}: ${description}`
    );

    const structuredOutputParserSchema = z.object({
      destination: z
        .string()
        .optional()
        .describe(
          'The name of the question answering system to use. This can just be "DEFAULT" without the quotes if you do not know which system is best.'
        ),
      next_inputs: z
        .object({
          query: z
            .string()
            .describe("The query to be fed into the next model."),
        })
        .describe("The input to be fed into the next model."),
    });

    const outputParser = new RouterOutputParser<
      typeof structuredOutputParserSchema
    >(structuredOutputParserSchema);

    const destinationsStr = destinations.join("\n");
    const routerTemplate = PromptTemplate.fromTemplate(
      await ROUTER_TEMPLATE(
        outputParser.getFormatInstructions({ interpolationDepth: 4 }),
        (await routerChainOpts?.history?.getMessages())
          ?.map((m) => `${m.name}: ${m.content}`)
          .join("\n")
      )
    );
    const routerPrompt = new PromptTemplate({
      template: await routerTemplate.format({
        destinations: destinationsStr,
      }),
      inputVariables: ["input"],
      outputParser,
    });
    const routerChain = LLMRouterChain.fromLLM(llm, routerPrompt, {
      ...routerChainOpts,
    });

    const destinationChains: {
      [name: string]: BaseChain;
    } = {};
    for (const [name, { chain }] of Object.entries(destinationChainsInfo)) {
      destinationChains[name] = chain;
    }

    if (!destinationChains[defaultChain]) {
      throw new Error(
        `Default chain ${defaultChain} not found in destination chains`
      );
    }

    return new RAIChatMultiRouteChain({
      ...multiRouteChainOpts,
      routerChain,
      destinationChains,
      defaultChain: destinationChains[defaultChain],
    });
  }

  _chainType(): string {
    return "rai_chat_multi_route";
  }
}
