import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  ["./node_modules/next/dist/bin/next", "dev", "--hostname", "localhost", "--port", "3000"],
  {
    env: { ...process.env, AI_USAGE_SECRET: "e2e-test-secret" },
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
