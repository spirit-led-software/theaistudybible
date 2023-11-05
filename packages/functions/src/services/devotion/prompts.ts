export const DEVO_BIBLE_READING_CHAIN_PROMPT_TEMPLATE = `You need to find a Bible reading within the following context and based on the following topic. Your output should match the formatting instructions exactly.

The previous bible readings are within <previous_bible_readings></previous_bible_readings> XML tags. Each previous bible reading is encapsulated within <bible_reading></bible_reading> XML tags. **IMPORTANT:** Your Bible reading should not be the same as any of the previous Bible readings.
The context is within <context></context> XML tags. Each document within the context is encapsulated within <document></document> XML tags.
The topic is within <topic></topic> XML tags.
The formatting instructions are within <format_instructions></format_instructions> XML tags.

<previous_bible_readings>
{previousBibleReadings}
</previous_bible_readings>

<context>
{context}
</context>

<topic>
{topic}
</topic>

<format_instructions>
{formatInstructions}
</format_instructions>

Put your output that follows the formatting instructions within <output></output> XML tags.`;

export const DEVO_GENERATOR_CHAIN_PROMPT_TEMPLATE = `You need to write a non-denominational Christian devotion based on the following context and Bible reading. Your output should match the formatting instructions exactly.

The context is within <context></context> XML tags. Each document within the context is encapsulated within <document></document> XML tags.
The Bible reading is within <bible_reading></bible_reading> XML tags.
The formatting instructions are within <format_instructions></format_instructions> XML tags.

<context>
{context}
</context>

<bible_reading>
{bibleReading}
</bible_reading>

<format_instructions>
{formatInstructions}
</format_instructions>

Put your output that follows the formatting instructions within <output></output> XML tags.`;

export const DEVO_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE = `Create an image generation prompt and a negative image generation prompt. Do not be verbose. Start with what should or shouldn't be in the image and then follow it with adjectives to describe the image. Base it on the devotion below. Some examples of prompts are also given below. Your output should match the formatting instructions exactly.
      
The examples are given within <examples></examples> XML tags.
The devotion is within <devotion></devotion> XML tags.
The formatting instructions are within <format_instructions></format_instructions> XML tags.

<examples>
Prompt: A beautiful sunset over the ocean with seagulls flying overhead. 8k, beautiful, high-quality, realistic.
Negative prompt: A dark night. Ugly, unrealistic, blurry, fake, cartoon, text, words, extra fingers, extra toes, extra limbs.
</examples>

<devotion>
Bible Reading:\n{bibleReading}\n\n
Summary:\n{summary}\n\n
Reflection:\n{reflection}\n\n
Prayer:\n{prayer}\n\n
</devotion>

<format_instructions>
{formatInstructions}
</format_instructions>

Put your output that follows the formatting instructions within <output></output> XML tags.`;

export const DEVO_IMAGE_CAPTION_CHAIN_PROMPT_TEMPLATE = `Generate a caption for the image that would be generated by the following prompt and devotion. Your caption should not be more than 100 words in length.

The prompt is within <prompt></prompt> XML tags.
The devotion is within <devotion></devotion> XML tags.

<prompt>
{imagePrompt}
</prompt>

<devotion>
Bible Reading:\n{bibleReading}\n\n
Summary:\n{summary}\n\n
Reflection:\n{reflection}\n\n
Prayer:\n{prayer}\n
</devotion>

Put the caption you come up with within <output></output> XML tags.`;
