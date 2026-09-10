import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3000"], {
  stdio: "inherit",
  windowsHide: true,
});

let shuttingDown = false;

function shutDown() {
  if (shuttingDown) return;
  shuttingDown = true;
  killTree(child);
}

function killTree(target) {
  if (!target.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(target.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    return;
  }
  target.kill("SIGTERM");
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
process.on("SIGHUP", shutDown);
child.on("exit", (code, signal) => {
  if (shuttingDown) {
    process.exit(0);
    return;
  }
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
