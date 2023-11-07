export const USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE = `Given the following prompt provided from a user, check whether the prompt is inappropriate. Inappropriate prompts include anything that involves sex, excessive violence or anything going against Christian doctrine.

If the prompt is inappropriate, return true. Otherwise, return false. Do not add any additional information to the output.

The user's prompt is within <user_prompt></user_prompt> XML tags.

<user_prompt>
{userPrompt}
</user_prompt>

Place your output within <output></output> XML tags.`;

export const USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE = `You goal is to generate short, concise, yet descriptive phrases that help to aid the provided user's prompt when generating a stable diffusion model image. Use **ONLY** the documents provided to make these phrases as descriptive as possible. The more descriptive the phrases are, the better the image will be. These phrases should not be proper sentences. Your output must match the formatting instructions exactly.

The documents are within <documents></documents> XML tags. Each individual document is encapsulated within <document></document> XML tags. **IMPORTANT:** The stable diffusion model knows nothing at all and does not have access to the documents provided to you or the Bible, so you must include as much detail as possible from the documents in your prompts to ensure a biblically accurate image is generated.

The user's prompt is within <user_prompt></user_prompt> XML tags. **IMPORTANT:** Make sure your phrases support this prompt.

The formatting instructions are within <format_instructions></format_instructions> XML tags.

<documents>
{documents}
</documents>

<user_prompt>
{userPrompt}
</user_prompt>

<format_instructions>
{formatInstructions}
</format_instructions>

Put your output that follows the formatting instructions within <output></output> XML tags.`;
