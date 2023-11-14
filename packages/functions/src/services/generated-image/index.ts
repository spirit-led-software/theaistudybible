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
    const chainResult = await chain.invoke({
      userPrompt,
    });

    const prompt = `${chainResult.join(
      ", "
    )}, christian, photo realistic, beautiful, stunning, 8k uhd, high quality, high definition, color, 3d, detailed hands, detailed fingers, detailed eyes, detailed feet`;
    const negativePrompt = `deformed iris, deformed pupils, semi-realistic, cgi, render, sketch, cartoon, drawing, anime, text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, random floating objects, black and white`;

    const replicate = new Replicate({
      auth: replicateConfig.apiKey,
    });
    const output = await replicate.run(replicateConfig.imageModel, {
      input: {
        prompt,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        scheduler: "KarrasDPM",
        refine: "expert_ensemble_refiner",
        num_inference_steps: 50,
        guidance_scale: 14,
        prompt_strength: 1.0,
        high_noise_frac: 0.8,
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
