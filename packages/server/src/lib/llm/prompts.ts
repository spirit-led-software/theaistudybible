// General prompts for use in various use cases

export const OUTPUT_FIXER_PROMPT_TEMPLATE = `You are an expert at fixing text completions from LLMs that are not formatted correctly. Your goal is to fix the completion provided to you so that it fixes the error and follows the formatting instructions exactly.

Here are some important rules for you to follow:
- Your output must match the formatting instructions exactly.
- Your output must fix the error.
- Carefully examine the error and the completion to determine what is wrong with the completion.

Here are some important things to consider:
- The error may not accurately reflect the real error in the completion.
- The error may not be the only error in the completion.
- Improperly escaped quotation marks cause errors, so you must check for and fix any improperly escaped quotation marks.
- Comments within code blocks cause errors, so you must remove all comments from the completion.
- JSON schemas are not allowed in the completion, so you must remove any JSON schemas from the completion.

Here is the completion that you are to fix, within <completion></completion> XML tags.
<completion>
{completion}
</completion>

Here is the error that you are to fix, within <error></error> XML tags. Read the error carefully, as it will tell you what is wrong with the completion.
<error>
{error}
</error>

Here are the formatting instructions that you must follow exactly, within <format_instructions></format_instructions> XML tags. If these instructions are not followed exactly, your output will be rejected.
<format_instructions>
{instructions}
</format_instructions>

Adjust the completion so that it fixes the error and follows the formatting instructions exactly.

Think carefully about your output first before you respond.`;

export const MARKDOWN_FORMATTING_INSTRUCTIONS = `Your output must be formatted in markdown. You are only allowed to use the following markdown syntax in your output:

- Headers should be formatted using the following syntax:
# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

- Unordered lists should be formatted using the following syntax:
- List item 1
- List item 2
- List item 3

- Numbered lists should be formatted using the following syntax:
1. List item 1
2. List item 2
3. List item 3

- Links should be formatted using the [text](url) syntax. For example:
[Google](https://www.google.com)

- Images should be formatted using the ![alt text](url) syntax. For example:
![Example image](https://www.example.com/image.jpg)

- Bold text should be formatted using the **text** syntax. For example:
**Bold text**

- Italic text should be formatted using the *text* syntax. For example:
*Italic text*

- Inline code should be formatted using the \`text\` syntax. For example:
\`Inline code\`

- Code blocks should be formatted using the \`\`\` syntax. For example:
\`\`\`
Code block
\`\`\`

- Block quotes should be formatted using the > symbol. For example:
> Block quote

- Horizontal rules should be formatted using three or more hyphens, asterisks, or underscores. For example:
---
***
___

- Tables should be formatted using the following syntax:
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

- Strikethrough text should be formatted using the ~~text~~ syntax. For example:
~~Strikethrough text~~

- Superscript text should be formatted using the ^ syntax. For example:
Superscript^text

- Subscript text should be formatted using the ~ syntax. For example:
Subscript~text


You are not allowed to use any other markdown syntax than what is described above.`;
