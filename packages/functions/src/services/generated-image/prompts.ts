export const USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE = `Given the following prompt provided from a user, check whether the prompt is inappropriate. If the prompt is inappropriate, return true. Otherwise, return false. Do not add any additional information to the output.

The user's prompt is within <user_prompt></user_prompt> XML tags.

<user_prompt>
{userPrompt}
</user_prompt>

Place your output within <output></output> XML tags.`;

export const USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE = `Create an image generation prompt and a negative image generation prompt. Do not be verbose. Start with what should or shouldn't be in the image and then follow it with adjectives to describe the image's style and attributes. You should base this prompt on the provided user prompt below. Use the documents provided to add more detail and color to the user's prompt. Your output must follow the formatting instructions exactly.
      
The examples are given within <examples></examples> XML tags.

The documents are within <documents></documents> XML tags. Each individual document is encapsulated within <document></document> XML tags.

The user's prompt is within <user_prompt></user_prompt> XML tags.

The formatting instructions are within <format_instructions></format_instructions> XML tags.

<examples>
Prompt: A biblically accurate representation of Jesus from the book Revelation. A sword coming from his mouth, and fire as eyes. 8k, beautiful, high-quality, realistic.
Negative prompt: Jesus from the gospels. Ugly, unrealistic, blurry, fake, cartoon, text, words, extra fingers, extra toes, extra limbs.
</examples>

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
