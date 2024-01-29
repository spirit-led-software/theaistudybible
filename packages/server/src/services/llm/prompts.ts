// General prompts for use in various use cases

export const OUTPUT_FIXER_PROMPT_TEMPLATE = `You are an expert at fixing text completions from LLMs that are not formatted correctly. Your goal is to fix the completion provided to you so that it fixes the error and follows the formatting instructions exactly.

Here are some important rules for you to follow:
- Your output must match the formatting instructions exactly.
- Your output must fix the error.
- Carefully examine the error and the completion to determine what is wrong with the completion.

Here are some important things to consider:
- The error may not accurately reflect the real error in the completion.
- The error may not be the only error in the completion.
- Errors most often occur when quotes in strings are not properly escaped, so be sure to carefully check all quotes in the completion.
- If the completion is formatted in JSON and there are code comments, you should remove them, as that results in errors.

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

Think carefully about your output first before you respond.

Put your output that follows the formatting instructions within <output></output> XML tags.`;
