import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  digestAppSpec,
  parseAppSpec,
} from "../../packages/app-spec/dist/index.js";

const root = resolve(import.meta.dirname, "../..");
execFileSync("cargo", ["build", "--locked", "-p", "wta"], {
  cwd: root,
  stdio: "inherit",
});
const cli = resolve(
  root,
  "target/debug",
  process.platform === "win32" ? "wta.exe" : "wta",
);
for (const name of ["url-app.json", "static-app.json"]) {
  const path = resolve(root, "packages/app-spec/examples", name);
  const spec = parseAppSpec(JSON.parse(readFileSync(path, "utf8")));
  const result = JSON.parse(
    execFileSync(cli, ["validate", path, "--json"], { encoding: "utf8" }),
  );
  assert.equal(
    result.sha256,
    digestAppSpec(spec),
    name + " must have the same Rust/TypeScript digest",
  );
}
console.log("Rust/TypeScript AppSpec contract and digest fixtures passed.");
