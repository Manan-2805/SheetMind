import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const electronDirectory = fileURLToPath(new URL("../electron/", import.meta.url));
const requireElectron = createRequire(new URL("../electron/package.json", import.meta.url));
const electronPath = requireElectron("electron");
const vite = await createServer({
  server: { host: "localhost", port: 5173, strictPort: true },
});

try {
  await vite.listen();
  vite.printUrls();
  const electron = spawn(electronPath, ["."], { cwd: electronDirectory, stdio: "inherit" });
  const stopElectron = () => electron.kill();
  process.once("SIGINT", stopElectron);
  process.once("SIGTERM", stopElectron);

  try {
    const [code, signal] = await once(electron, "exit");
    process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
  } finally {
    process.off("SIGINT", stopElectron);
    process.off("SIGTERM", stopElectron);
  }
} finally {
  await vite.close();
}
