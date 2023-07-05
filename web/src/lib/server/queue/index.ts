import { queueConfig, redisConfig } from "@configs";
import { Queue } from "bullmq";
import path from "path";
import { URL } from "url";
import { Worker } from "worker_threads";

export const indexFileQueue = new Queue(queueConfig.indexFileQueue.name, {
  connection: {
    host: redisConfig.host,
    port: redisConfig.port,
    username: redisConfig.username,
    password: redisConfig.password,
  },
});

export function initialize() {
  const indexFileWorker = new Worker(
    new URL(path.join(__dirname, "workers/index-file.ts"), import.meta.url)
  );
  indexFileWorker.on("message", (message) => {
    console.log(message);
  });
  indexFileWorker.on("error", (err) => {
    console.error(err);
  });
  indexFileWorker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });

  const indexWebsiteWorker = new Worker(
    new URL(path.join(__dirname, "workers/index-website.ts"), import.meta.url)
  );
  indexWebsiteWorker.on("message", (message) => {
    console.log(message);
  });
  indexWebsiteWorker.on("error", (err) => {
    console.error(err);
  });
  indexWebsiteWorker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
}
