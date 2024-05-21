import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { userGeneratedImages, userGeneratedImagesToSourceDocuments } from '@core/database/schema';
import type { UserGeneratedImage } from '@core/model/generated-image';
import { similarityFunctionMapping } from '@core/model/source-document';
import type { StabilityModelInput, StabilityModelOutput } from '@core/types/bedrock';
import { getImagePromptChain } from '@langchain/lib/chains/generated-image';
import { eq } from 'drizzle-orm';
import { db } from './database';

export async function generatedImage({
  userPrompt,
  userId
}: {
  userPrompt: string;
  userId: string;
}): Promise<UserGeneratedImage> {
  let userGeneratedImage: UserGeneratedImage | undefined;
  try {
    userGeneratedImage = (
      await db
        .insert(userGeneratedImages)
        .values({
          userId,
          userPrompt
        })
        .returning()
    )[0];

    const chain = await getImagePromptChain();
    const { prompt, sourceDocuments, searchQueries } = await chain.invoke({
      userPrompt
    });

    await Promise.all(
      sourceDocuments.map(async (sourceDoc) => {
        await db.insert(userGeneratedImagesToSourceDocuments).values({
          userGeneratedImageId: userGeneratedImage!.id,
          sourceDocumentId: sourceDoc.id.toString(),
          distance: 1 - sourceDoc.score!,
          distanceMetric: similarityFunctionMapping[sourceDoc.similarityFunction!]
        });
      })
    );

    const client = new BedrockRuntimeClient();
    const invokeCommand = new InvokeModelCommand({
      modelId: 'stability.stable-diffusion-xl-v1',
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1.0
          }
        ],
        height: 1024,
        width: 1024,
        cfg_scale: 30,
        style_preset: 'cinematic',
        steps: 50
      } satisfies StabilityModelInput),
      contentType: 'application/json',
      accept: 'application/json'
    });
    const result = await client.send(invokeCommand);
    if (result.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to generate image: ${result.$metadata.httpStatusCode}`);
    }

    // convert result.body into string
    const body = new TextDecoder('utf-8').decode(result.body as Uint8Array);
    const output = JSON.parse(body) as StabilityModelOutput;
    if (output.result !== 'success') {
      throw new Error(`Failed to generate image: ${output.result}`);
    }

    const image = Buffer.from(output.artifacts[0].base64, 'base64');
    const r2Obj = await env.BUCKET.put(`generated-images/${userGeneratedImage.id}.png`, image);
    if (!r2Obj) {
      throw new Error('Failed to upload image');
    }

    return (
      await db
        .update(userGeneratedImages)
        .set({
          prompt,
          searchQueries
        })
        .where(eq(userGeneratedImages.id, userGeneratedImage.id))
        .returning()
    )[0];
  } catch (error) {
    console.error(error);
    if (userGeneratedImage) {
      await db
        .update(userGeneratedImages)
        .set({
          failed: true
        })
        .where(eq(userGeneratedImages.id, userGeneratedImage.id));
    }
    throw error;
  }
}
