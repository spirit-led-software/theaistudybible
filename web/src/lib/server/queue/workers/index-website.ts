import { queueConfig, redisConfig } from "@configs/index";
import { Job, Worker } from "bullmq";
import { parentPort } from "worker_threads";

export const worker = new Worker(
  queueConfig.indexWebsiteQueue.name,
  async (job: Job) => {
    const { fields, files } = job.data;
    console.log({ fields, files });
  },
  {
    concurrency: queueConfig.indexWebsiteQueue.concurrency,
    connection: {
      host: redisConfig.host,
      port: redisConfig.port,
      username: redisConfig.username,
      password: redisConfig.password,
    },
  }
);

worker.on("completed", (job) => {
  parentPort?.postMessage(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  parentPort?.postMessage(`Job ${job?.id} failed with ${err.message}`);
});
