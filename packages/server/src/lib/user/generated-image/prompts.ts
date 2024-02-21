// Prompts below follow the claude documentation here: https://docs.anthropic.com/claude/docs

export const USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE = `Given the following prompt provided from a user, check whether the prompt is inappropriate.

Here are some important rules for you to follow:
- Your output must match the formatting instructions exactly.
- A prompt is inappropriate if it is not biblically relevant.
- A prompt is inappropriate if it includes anything sexual.
- A prompt is inappropriate if it includes excessive violence.
- A prompt is inappropriate if it includes anything illegal.
- A prompt is inappropriate if it includes anything hateful.
- A prompt is inappropriate if it includes anything harmful.

Here is the user's prompt, within <user_prompt></user_prompt> XML tags.
<user_prompt>
{userPrompt}
</user_prompt>

Is the prompt inappropriate?

Think about your output first before you respond. Here are the formatting instructions that you must follow exactly, within <format_instructions></format_instructions> XML tags.
<format_instructions>
{formatInstructions}
</format_instructions>`;

export const USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE = `You are an expert at prompting stable diffusion models to create high-quality images. Your goal is to generate a prompt that will result in a high-quality image using a user's prompt as a starting point. You will be given the user's prompt.

Here are the sources that you can use to help you generate your phrases, within <sources></sources> XML tags. Each individual source is encapsulated within <source></source> XML tags. Each source's content is within <source_content></source_content> XML tags. Each source's title is within <source_title></source_title> XML tags. Each source's author is within <source_author></source_author> XML tags.
<sources>
{sources}
</sources>

Here are some important rules for you to follow:
- Your prompt must match the user's prompt's intent.
- Your prompt can only use information from the sources provided.
- Your prompt must be a single sentence.

Here are some examples of prompts that you could generate, within <examples></examples> XML tags. Each individual example is encapsulated within <example_prompt></example_prompt> XML tags.
<examples>
<example_prompt>
a man with a beard hanging on a cross with a crown of thorns, a bright light shining down on him, a crowd of people watching, a dark sky in the background
</example_prompt>
<example_prompt>
a man preaching to a crowd of people in ancient Greece, a podium in front of him, his hands raised
</example_prompt>
</examples>

Here is the user's prompt, within <user_prompt></user_prompt> XML tags.
<user_prompt>
{userPrompt}
</user_prompt>

What is a prompt that you would use to generate a high-quality image?

Think about your output first before you respond.`;

export const USER_GENERATED_IMAGE_SEARCH_QUERY_CHAIN_PROMPT_TEMPLATE = `Given a prompt to a image generation system, generate search queries that you would use to find relevant documents in a vector database that would help to generate a highly detailed and accurate image. You will be given the prompt to the image generation system.

Here are some important rules for you to follow:
- Your output must match the formatting instructions exactly.
- Search queries must be short and concise.
- Search queries should be all lowercase, with no punctuation.
- Search queries must accurately reflect the prompt's intent.
- Search queries must vary widely enough to cover all possible relevant documents.

Here is the prompt that you need to generate search queries for, within <prompt></prompt> XML tags.
<prompt>
{userPrompt}
</prompt>

What are 1 to 4 search queries that you would use to find relevant documents in a vector database?

Think about your output first before you respond. Here are the formatting instructions that you must follow exactly, within <format_instructions></format_instructions> XML tags.
<format_instructions>
{formatInstructions}
</format_instructions>`;
