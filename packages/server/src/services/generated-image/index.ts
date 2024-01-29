import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from '@revelationsai/core/configs/axios';
import s3Config from '@revelationsai/core/configs/s3';
import type { UserWithRoles } from '@revelationsai/core/model/user';
import type { UserGeneratedImage } from '@revelationsai/core/model/user/generated-image';
import type { StabilityModelInput, StabilityModelOutput } from '@revelationsai/core/types/bedrock';
import {
  createUserGeneratedImage,
  updateUserGeneratedImage
} from '../../services/generated-image/generated-image';
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
    const chainResult = await chain.invoke({
      userPrompt
    });

    const prompt = `${userPrompt}, ${chainResult.join(', ')}`;

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
        cfg_scale: 14.0,
        style_preset: 'cinematic',
        steps: 30
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
        Bucket: s3Config.userGeneratedImageBucket,
        Key: `${userGeneratedImage.id}.png`
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

    const imageUrl = s3Url.split('?')[0];
    return await updateUserGeneratedImage(userGeneratedImage.id, {
      url: imageUrl,
      prompt
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

export * from './generated-image';
