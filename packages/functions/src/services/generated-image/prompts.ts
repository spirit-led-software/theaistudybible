export const USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE = `Given the following prompt provided from a user, check whether the prompt is inappropriate. Inappropriate prompts include anything that involves sex, excessive violence or anything going against Christian doctrine.

If the prompt is inappropriate, return true. Otherwise, return false. Do not add any additional information to the output.

The user's prompt is within <user_prompt></user_prompt> XML tags.

<user_prompt>
{userPrompt}
</user_prompt>

Place your output within <output></output> XML tags.`;

export const USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE = `Create an image generation prompt and a negative image generation prompt that will be fed into an stable diffusion model. Start with what should or shouldn't be included in the image and then follow it with adjectives to describe the image's style. Your prompts should semantically resemble the user's prompt provided. You must use the documents provided when generating your prompts to add detail of what is included in and excluded from the image. Your output must follow the formatting instructions exactly. 

**DO NOT BE VERBOSE!** Your prompts should aim to be 1 sentence and can be at most 3 sentences long. The stable diffusion model does not understand language like you do. Your prompts should include descriptive adjectives and phrases, and not proper sentences. **DO NOT INCLUDE ANYTHING THAT IS NOT IN THE DOCUMENTS!**

The documents are within <documents></documents> XML tags. Each individual document is encapsulated within <document></document> XML tags. **IMPORTANT:** The stable diffusion model knows nothing at all and does not have access to the documents provided to you or the Bible, so you must include as much detail as possible from the documents in your prompts to ensure a biblically accurate image is generated.

The user's prompt is within <user_prompt></user_prompt> XML tags.

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
