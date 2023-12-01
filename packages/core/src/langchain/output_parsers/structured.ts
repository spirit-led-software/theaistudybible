import { StructuredOutputParser } from 'langchain/output_parsers';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class RAIStructuredOutputParser<T extends z.ZodTypeAny> extends StructuredOutputParser<
  z.infer<T>
> {
  static lc_name() {
    return 'RAIStructuredOutputParser';
  }

  constructor(readonly schema: T) {
    super(schema);
  }

  getFormatInstructions(): string {
    return `You must format your output as a JSON value that adheres to a given JSON schema.

It is important to note that a JSON schema and a JSON value are two different things. A JSON schema is a document that describes the structure of a JSON value. A JSON value is a JSON document that adheres to a given JSON schema.

The following is an example of a JSON schema and a JSON value that adheres to that schema, within <example></example> XML tags. Note that the JSON schema is within <example_json_schema></example_json_schema> XML tags, and the JSON value is within <example_json_value></example_json_value> XML tags. Here is the example:
<example>
  <example_json_schema>
  \`\`\`json
  {
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "age": {
        "type": "integer"
      }
    },
    "required": ["name", "age"]
  }
  \`\`\`
  </example_json_schema>
  <example_json_value>
  \`\`\`json
  {
    "name": "John Doe",
    "age": 42
  }
  \`\`\`
  </example_json_value>
</example>

Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema below exactly without syntax errors!

Here is the JSON schema your output must adhere to, within <json_schema></json_schema> XML tags:
<json_schema>
\`\`\`json
${JSON.stringify(zodToJsonSchema(this.schema))}
\`\`\`
</json_schema>`;
  }
}
