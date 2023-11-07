import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { axios, replicateConfig, s3Config } from "@core/configs";
import type { UserGeneratedImage, UserWithRoles } from "@core/model";
import {
  createUserGeneratedImage,
  updateUserGeneratedImage,
} from "@services/generated-image/generated-image";
import Replicate from "replicate";
import { getImagePromptChain } from "./langchain";

export async function generatedImage(
  user: UserWithRoles,
  userPrompt: string
): Promise<UserGeneratedImage> {
  let userGeneratedImage: UserGeneratedImage | undefined;
  try {
    userGeneratedImage = await createUserGeneratedImage({
      userId: user.id,
      userPrompt,
    });

    const chain = await getImagePromptChain();
    const { prompt, negativePrompt } = await chain.invoke({
      userPrompt,
    });

    const replicate = new Replicate({
      auth: replicateConfig.apiKey,
    });
    const output = await replicate.run(replicateConfig.imageModel, {
      input: {
        prompt: `${userPrompt}. ${prompt}. Photo realistic, beautiful, stunning, 8K, high quality, high definition, HD, color, three dimensional, 3D.`,
        negative_prompt: `${negativePrompt}. Ugly, blurry, low quality, cartoon, drawing, black and white, words, letters, extra limbs, extra fingers, extra toes.`,
        width: 512,
        height: 512,
        num_outputs: 1,
        num_inference_steps: 30,
        guidance_scale: 8,
        scheduler: "K_EULER",
        refine: "expert_ensemble_refiner",
        prompt_strength: 1,
      },
    });
    console.log("Output from replicate:", output);
    if (!Array.isArray(output)) {
      throw new Error("Replicate output not formatted as expected");
    }

    const urlArray = output as string[];
    const url = urlArray[0];
    const image = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const s3Client = new S3Client({});
    const s3Url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        ACL: "public-read",
        ContentType: "image/png",
        Bucket: s3Config.userGeneratedImageBucket,
        Key: `${userGeneratedImage.id}.png`,
      })
    );

    if (!s3Url) {
      throw new Error("Failed to get presigned url for s3 upload");
    }

    const s3UploadResponse = await axios.put(s3Url, image.data, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": image.data.byteLength,
      },
    });

    if (s3UploadResponse.status !== 200) {
      throw new Error(
        `Failed to upload image to s3: ${s3UploadResponse.status} ${s3UploadResponse.statusText}`
      );
    }

    const imageUrl = s3Url.split("?")[0];
    return await updateUserGeneratedImage(userGeneratedImage.id, {
      url: imageUrl,
      prompt,
      negativePrompt,
    });
  } catch (error) {
    console.error(error);
    if (userGeneratedImage) {
      await updateUserGeneratedImage(userGeneratedImage.id, {
        failed: true,
      });
    }
    throw error;
  }
}

export * from "./generated-image";
