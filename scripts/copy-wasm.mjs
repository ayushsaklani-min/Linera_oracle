import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(projectRoot, "..");
const targetDir = resolve(workspaceRoot, "target", "wasm32-unknown-unknown", "release");
const wasmDir = resolve(workspaceRoot, "wasm");

const artifacts = [
  {
    source: resolve(targetDir, "price_oracle_contract.wasm"),
    destination: resolve(wasmDir, "contract.wasm"),
  },
  {
    source: resolve(targetDir, "price_oracle_service.wasm"),
    destination: resolve(wasmDir, "service.wasm"),
  },
];

if (!existsSync(wasmDir)) {
  mkdirSync(wasmDir, { recursive: true });
}

for (const { source, destination } of artifacts) {
  if (!existsSync(source)) {
    console.error(`Missing build artifact: ${source}`);
    process.exitCode = 1;
    continue;
  }

  cpSync(source, destination);
  console.log(`Copied ${source} -> ${destination}`);
}

