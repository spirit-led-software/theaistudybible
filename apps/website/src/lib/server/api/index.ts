import { clerkMiddleware } from "@hono/clerk-auth";
import { sentry } from "@hono/sentry";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import adminRoutes from "~/lib/server/api/endpoints/admin";
import type { Bindings, Variables } from "~/lib/server/api/types";
import bibles from "./endpoints/public/bibles";
import dataSources from "./endpoints/public/data-sources";
import devotions from "./endpoints/public/devotions";
import chats from "./endpoints/secure/chats";
import generatedImages from "./endpoints/secure/generated-images";
import messages from "./endpoints/secure/messages";
import webhooks from "./endpoints/webhooks";

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .use("*", logger())
  .use("*", cors())
  .use(
    "*",
    sentry({
      dsn: "https://8f8843759a63e1580a37e607f2c845d6@o4507103632359424.ingest.us.sentry.io/4507124309622784",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0.0,
    })
  )
  .use(
    "*",
    async (c, next) =>
      await clerkMiddleware({
        publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
      })(c, next)
  )
  .notFound((c) => {
    return c.json(
      {
        message: "Route not found",
      },
      404
    );
  })
  .onError((e, c) => {
    console.error(e);
    c.get("sentry").captureException(e);
    return c.json(
      {
        message: "Internal server error",
        data: e,
      },
      500
    );
  });

const routes = app
  // Public routes
  .route("/bibles", bibles)
  .route("/data-sources", dataSources)
  .route("/devotions", devotions)
  // Secure routes
  .route("/chats", chats)
  .route("/generated-images", generatedImages)
  .route("/messages", messages)
  // Other routes
  .route("/admin", adminRoutes)
  .route("/webhooks", webhooks);
export type RouterType = typeof routes;

export const handler = handle(app);
