import { run } from "graphile-worker";

import { createTaskList } from "./tasks.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to start WebToApp jobs.");
}

const runner = await run({
  connectionString: databaseUrl,
  concurrency: Number.parseInt(process.env.JOB_CONCURRENCY ?? "5", 10),
  noHandleSignals: false,
  pollInterval: 1_000,
  taskList: createTaskList(databaseUrl),
});

await runner.promise;
