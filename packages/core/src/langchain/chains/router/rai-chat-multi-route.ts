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
import { z } from "zod";

const ROUTER_TEMPLATE = (
  formatting: string
) => `Given a query to a question answering system, select the system best suited for the input. You will be given the names of the available systems and a description of what questions the system is best suited for. The formatting must match the the following instructions exactly. If you do not know which one would be best, just return "DEFAULT" without the quotes.

The formatting instructions are within <format_instructions></format_instructions> XML tags.
The candidate systems are within <candidates></candidates> XML tags. IMPORTANT: The candidates are in the format of "[name]: [description]" where [name] is the name of the question answering system and [description] is a description of what questions the system is best suited for. Only the name of the system should be returned.
The input is within <input></input> XML tags. IMPORTANT: Do not modify the input in any way.

<format_instructions>
${formatting}
</format_instructions>

<candidates>
{destinations}
</candidates>

<input>
{{input}}
</input>`;

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
      routerChainOpts?: Partial<LLMRouterChainInput>;
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
          'The name of the question answering system to use or "DEFAULT".'
        ),
      next_inputs: z
        .object({
          query: z
            .string()
            .describe("The original input as it was given exactly."),
        })
        .describe("The input to be fed into the next model."),
    });

    const outputParser = new RouterOutputParser<
      typeof structuredOutputParserSchema
    >(structuredOutputParserSchema);

    const destinationsStr = destinations.join("\n");
    const routerTemplate = PromptTemplate.fromTemplate(
      ROUTER_TEMPLATE(
        outputParser.getFormatInstructions({ interpolationDepth: 4 })
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
