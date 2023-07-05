import * as queues from "@server/queue";

export async function register() {
  console.log("Registering instrumentation");
  queues.initialize();
}
