import { PromptTemplate } from "langchain";
import { BaseLanguageModel } from "langchain/base_language";
import {
  BaseChain,
  LLMRouterChain,
  LLMRouterChainInput,
  MultiRouteChain,
  MultiRouteChainInput,
} from "langchain/chains";
import { RouterOutputParser } from "langchain/output_parsers";
import { z } from "zod";

const ROUTER_TEMPLATE = (
  formatting: string
) => `Given a query to a question answering system, select the system best suited for the input. You will be given the names of the available systems and a description of what questions the system is best suited for. You may also revise the original input if you think that revising it will ultimately lead to a better response.

<< FORMATTING >>
${formatting}

REMEMBER: "destination" MUST be one of the candidate prompt names specified below OR it can be "DEFAULT" if the input is not well suited for any of the candidate prompts.
REMEMBER: "next_inputs.query" can just be the original input if you don't think any modifications are needed.

<< CANDIDATE PROMPTS >>
{destinations}

<< INPUT >>
{{input}}

<< OUTPUT >>
`;

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
        .describe('name of the question answering system to use or "DEFAULT"'),
      next_inputs: z
        .object({
          query: z
            .string()
            .describe("a potentially modified version of the original input"),
        })
        .describe("input to be fed to the next model"),
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
