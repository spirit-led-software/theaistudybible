import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { userGeneratedImagesToSourceDocuments } from '@revelationsai/core/database/schema';
import axios from '@revelationsai/core/lib/axios';
import type { UserWithRoles } from '@revelationsai/core/model/user';
import type { UserGeneratedImage } from '@revelationsai/core/model/user/generated-image';
import type { StabilityModelInput, StabilityModelOutput } from '@revelationsai/core/types/bedrock';
import { Bucket } from 'sst/node/bucket';
import { Config } from 'sst/node/config';
import { similarityFunctionMapping } from '../../../services/source-document';
import {
  createUserGeneratedImage,
  updateUserGeneratedImage
} from '../../../services/user/generated-image';
import { db } from '../../database';
import { getImagePromptChain } from './langchain';

export async function generatedImage(
  user: UserWithRoles,
  userPrompt: string
): Promise<UserGeneratedImage> {
  let userGeneratedImage: UserGeneratedImage | undefined;
  try {
    userGeneratedImage = await createUserGeneratedImage({
      userId: user.id,
      userPrompt
    });

    const chain = await getImagePromptChain();
    const { prompt, sourceDocuments, searchQueries } = await chain.invoke({
      userPrompt
    });

    await Promise.all(
      sourceDocuments.map(async (sourceDoc) => {
        await db.insert(userGeneratedImagesToSourceDocuments).values({
          userGeneratedImageId: userGeneratedImage!.id,
          sourceDocumentId: sourceDoc.id.toString(),
          distance: sourceDoc.score!,
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

    const s3Client = new S3Client({});
    const s3Url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        ACL: 'public-read',
        ContentType: 'image/png',
        Bucket: Bucket.PublicBucket.bucketName,
        Key: `user-generated-images/${userGeneratedImage.id}.png`
      })
    );
    if (!s3Url) {
      throw new Error('Failed to get presigned url for s3 upload');
    }

    const image = Buffer.from(output.artifacts[0].base64, 'base64');
    const s3UploadResponse = await axios.put(s3Url, image, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': image.length
      }
    });

    if (s3UploadResponse.status !== 200) {
      throw new Error(
        `Failed to upload image to s3: ${s3UploadResponse.status} ${s3UploadResponse.statusText}`
      );
    }

    let imageUrl = new URL(s3Url.split('?')[0]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - this may not be defined in non-prod-envs
    if (Config.CDN_URL) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - this may not be defined in non-prod-envs
      imageUrl = new URL(`${Config.CDN_URL}${imageUrl.pathname}`);
    }

    return await updateUserGeneratedImage(userGeneratedImage.id, {
      url: imageUrl.toString(),
      prompt,
      searchQueries
    });
  } catch (error) {
    console.error(error);
    if (userGeneratedImage) {
      await updateUserGeneratedImage(userGeneratedImage.id, {
        failed: true
      });
    }
    throw error;
  }
}
