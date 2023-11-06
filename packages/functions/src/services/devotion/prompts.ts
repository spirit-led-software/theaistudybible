export const DEVO_BIBLE_READING_CHAIN_PROMPT_TEMPLATE = `You need to find a Bible reading within the following documents and based on the following topic. Your output should match the formatting instructions exactly. You are also given a list of off-limits Bible readings, which you should not use.

The off-limits Bible readings are within <off_limits_bible_readings></off_limits_bible_readings> XML tags. Each individual Bible reading is encapsulated within <bible_reading></bible_reading> XML tags. **IMPORTANT:** You are not allowed to use any of these Bible readings under any circumstances!!

The documents are within <documents></documents> XML tags. Each individual document is encapsulated within <document></document> XML tags. **IMPORTANT:** These documents are where you are to pull your Bible reading from, **not the previous Bible readings!!**

The topic is within <topic></topic> XML tags.

The formatting instructions are within <format_instructions></format_instructions> XML tags.

<off_limits_bible_readings>
{previousBibleReadings}
</off_limits_bible_readings>

<documents>
{documents}
</documents>

<topic>
{topic}
</topic>

<format_instructions>
{formatInstructions}
</format_instructions>

Put your output that follows the formatting instructions within <output></output> XML tags.`;

export const DEVO_GENERATOR_CHAIN_PROMPT_TEMPLATE = `You need to write a non-denominational Christian devotion based on the following documents and Bible reading. Your output should match the formatting instructions exactly.

The documents are within <documents></documents> XML tags. Each individual document is encapsulated within <document></document> XML tags.

The Bible reading is within <bible_reading></bible_reading> XML tags.

The formatting instructions are within <format_instructions></format_instructions> XML tags.

<documents>
{documents}
</documents>

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
