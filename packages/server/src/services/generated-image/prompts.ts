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
</format_instructions>

Place your output within <output></output> XML tags.`;

export const USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE = `You are an expert at prompting stable diffusion models to create high-quality images. Your goal is to generate short, concise, yet descriptive phrases that help to aid the provided user's prompt when generating a stable diffusion model image.

Here are some documents you can use to help you generate your phrases, within <documents></documents> XML tags. Each individual document is encapsulated within <document></document> XML tags. **IMPORTANT:** The stable diffusion model knows nothing at all and does not have access to the documents provided to you or the Bible, so you must include as much detail as possible from the documents in your output to ensure a biblically accurate image is generated.
<documents>
{documents}
</documents>

Here are some important rules for you to follow:
- Your output must match the formatting instructions exactly.
- Your phrases must support the user's prompt.
- Your phrases must be short and concise, but also descriptive.
- Your phrases must not conflict with one another.
- All of the phrases must be able to be used together to generate a stable diffusion model image.

Here is an example of an output that you could generate, within <example></example> XML tags. Within the example is an example user prompt within <example_user_prompt></example_user_prompt> XML tags. Also in the example is an example output within <example_output></example_output> XML tags.
<example>
<example_user_prompt>
Jesus on the cross
</example_user_prompt>
<example_output>
\`\`\`json ["a man with long hair, a beard, and a crown of thorns on his head is nailed to a cross","women weeping and mourning at the foot of the cross","soldiers standing guard at the foot of the cross","a sign on the cross in a foreign language"]\`\`\`
</example_output>
</example>

Here is the user's prompt, within <user_prompt></user_prompt> XML tags.
<user_prompt>
{userPrompt}
</user_prompt>

What are {numPhrases} phrases that could help to aid the user's prompt when generating a stable diffusion model image?

Think about your output first before you respond. Here are the formatting instructions that you must follow exactly, within <format_instructions></format_instructions> XML tags.
<format_instructions>
{formatInstructions}
</format_instructions>

Put your output that follows the formatting instructions within <output></output> XML tags.`;
