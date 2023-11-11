import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { axios, replicateConfig, s3Config } from "@core/configs";
import type {
  CreateDevotionImageData,
  Devotion,
  UpdateDevotionImageData,
} from "@core/model";
import { devotionImages } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, desc, eq } from "drizzle-orm";
import Replicate from "replicate";
import { getImageCaptionChain, getImagePromptChain } from "./langchain";

export async function getDevotionImages(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const {
    where,
    limit = 25,
    offset = 0,
    orderBy = desc(devotionImages.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(devotionImages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotionImage(id: string) {
  return (
    await readOnlyDatabase
      .select()
      .from(devotionImages)
      .where(eq(devotionImages.id, id))
  ).at(0);
}

export async function getDevotionImageOrThrow(id: string) {
  const devotionImage = await getDevotionImage(id);
  if (!devotionImage) {
    throw new Error(`DevotionImage with id ${id} not found`);
  }
  return devotionImage;
}

export async function getDevotionImagesByDevotionId(devotionId: string) {
  return await readOnlyDatabase
    .select()
    .from(devotionImages)
    .where(eq(devotionImages.devotionId, devotionId));
}

export async function createDevotionImage(data: CreateDevotionImageData) {
  return (
    await readWriteDatabase.insert(devotionImages).values(data).returning()
  )[0];
}

export async function updateDevotionImage(
  id: string,
  data: UpdateDevotionImageData
) {
  return (
    await readWriteDatabase
      .update(devotionImages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(devotionImages.id, id))
      .returning()
  )[0];
}

export async function deleteDevotionImage(id: string) {
  return (
    await readWriteDatabase
      .delete(devotionImages)
      .where(eq(devotionImages.id, id))
      .returning()
  )[0];
}

export async function generateDevotionImages(devo: Devotion) {
  const imagePromptChain = getImagePromptChain();
  const imagePromptPhrases = await imagePromptChain.invoke({
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection,
    prayer: devo.prayer,
  });
  console.log("Image prompt phrases:", imagePromptPhrases);

  const imageCaptionChain = getImageCaptionChain();
  const imageCaption = await imageCaptionChain.invoke({
    imagePrompt: imagePromptPhrases.join(", "),
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection!,
    prayer: devo.prayer!,
  });
  console.log("Image caption:", imageCaption);

  const imagePrompt = `${imagePromptPhrases.join(
    ", "
  )}, photo realistic, beautiful, stunning, 8k uhd, high quality, high definition, color, 3d, beautiful hands, detailed fingers, beautiful eyes`;
  const negativeImagePrompt = `deformed iris, deformed pupils, semi-realistic, cgi, render, sketch, cartoon, drawing, anime, text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, black and white`;

  const replicate = new Replicate({
    auth: replicateConfig.apiKey,
  });
  const output = await replicate.run(replicateConfig.imageModel, {
    input: {
      prompt: imagePrompt,
      negative_prompt: negativeImagePrompt,
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

  for (let i = 0; i < urlArray.length; i++) {
    const url = urlArray[i];
    try {
      const image = await axios.get(url, {
        responseType: "arraybuffer",
      });

      const s3Client = new S3Client({});
      const s3Url = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          ACL: "public-read",
          ContentType: "image/png",
          Bucket: s3Config.devotionImageBucket,
          Key: `${devo.id}-${i}.png`,
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
      await createDevotionImage({
        devotionId: devo.id,
        url: imageUrl,
        caption: imageCaption,
        prompt: imagePrompt,
        negativePrompt: negativeImagePrompt,
      });
    } catch (e) {
      console.error("Error saving devotion image", e);
    }
  }
}
