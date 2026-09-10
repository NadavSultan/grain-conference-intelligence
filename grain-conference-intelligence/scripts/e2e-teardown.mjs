import { execFileSync } from "node:child_process";

const PORT = "3000";

export default function teardown() {
  if (process.platform !== "win32") {
    return;
  }
  for (const pid of listeningPids(PORT)) {
    try {
      execFileSync("taskkill", ["/PID", pid, "/T", "/F"], { stdio: "ignore" });
    } catch {
      // The listener may already have exited.
    }
  }
}

function listeningPids(port) {
  let output = "";
  try {
    output = execFileSync("netstat", ["-ano", "-p", "tcp"], { encoding: "utf8" });
  } catch {
    return [];
  }
  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) continue;
    if (!line.includes(`:${port} `) && !line.endsWith(`:${port}`)) continue;
    const pid = line.trim().split(/\s+/).pop();
    if (pid && pid !== "0") pids.add(pid);
  }
  return [...pids];
}
