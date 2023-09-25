import {
  AppStoreServerAPIClient,
  Environment,
  ReceiptUtility,
} from "@apple/app-store-server-library";
import { envConfig } from "@core/configs";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from "@lib/api-responses";
import fs from "fs";
import path from "path";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  console.log(`Received verify purchase event: ${JSON.stringify(event)}`);

  const {
    source,
    productId,
    serverVerificationData,
    localVerificationData,
    userId,
  }: {
    source: "app_store" | "google_play";
    productId: string;
    serverVerificationData: string;
    localVerificationData: string;
    userId: string;
  } = JSON.parse(event.body || "{}");

  if (
    !source ||
    !productId ||
    !serverVerificationData ||
    !localVerificationData ||
    !userId
  ) {
    return BadRequestResponse("Missing required parameters");
  }

  try {
    const issuerId = process.env.APPLE_APP_STORE_ISSUER_ID!;
    const keyId = process.env.APPLE_APP_STORE_KEY_ID!;
    const bundleId = "com.passgoco.revelationsai";
    const encodedKey = fs
      .readFileSync(path.resolve("apple-app-store-key.p8"))
      .toString();
    const environment = envConfig.development
      ? Environment.SANDBOX
      : Environment.PRODUCTION;

    const client = new AppStoreServerAPIClient(
      encodedKey,
      keyId,
      issuerId,
      bundleId,
      environment
    );

    if (source === "app_store") {
      const receiptUtil = new ReceiptUtility();
      const transactionId = receiptUtil.extractTransactionIdFromAppReceipt(
        serverVerificationData
      );

      if (!transactionId) {
        return BadRequestResponse("Invalid receipt");
      }

      console.log(`Transaction ID: ${transactionId}`);

      const transactionInfo = await client.getTransactionInfo(transactionId);
      if (transactionInfo.signedTransactionInfo) {
        const infos: string[] = transactionInfo.signedTransactionInfo
          .split(".")
          .map((info) => {
            return atob(info);
          });

        console.log(`Transaction info: ${JSON.stringify(infos)}`);
      }
    } else {
      return BadRequestResponse(`Invalid source: ${source}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hello from API",
      }),
    };
  } catch (error: any) {
    console.error(`Error validating purchase: ${error.stack}`);
    return InternalServerErrorResponse(error.message);
  }
});
