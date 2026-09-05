import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

// Inspect installed manifests, not pnpm's optional-package store indexes.
// Each OS checks packages installed there, including optional native dependencies.
// Release SBOMs still need target-specific license review.
export function collectLicenses(store) {
  const packages = new Map();
  const visited = new Set();
  function inspect(path) {
    const actual = realpathSync(path);
    if (visited.has(actual)) return;
    visited.add(actual);
    const manifest = JSON.parse(
      readFileSync(join(actual, "package.json"), "utf8"),
    );
    if (
      typeof manifest.name !== "string" ||
      typeof manifest.version !== "string"
    ) {
      throw new Error(`Invalid package manifest: ${actual}`);
    }
    const license =
      typeof manifest.license === "string" ? manifest.license : "UNKNOWN";
    packages.set(`${manifest.name}@${manifest.version}`, license);
  }
  for (const entry of readdirSync(store, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;
    const modules = join(store, entry.name, "node_modules");
    for (const dependency of readdirSync(modules, { withFileTypes: true })) {
      if (dependency.name.startsWith(".")) continue;
      const path = join(modules, dependency.name);
      if (dependency.name.startsWith("@")) {
        for (const scoped of readdirSync(path)) inspect(join(path, scoped));
      } else {
        inspect(path);
      }
    }
  }
  if (packages.size === 0)
    throw new Error("No installed dependencies found; run pnpm install.");
  return packages;
}

export function checkLicenses(packages) {
  const reviewed = new Set([
    "(MIT AND Zlib)",
    "0BSD",
    "Apache-2.0",
    "Apache-2.0 AND LGPL-3.0-or-later",
    "Apache-2.0 OR MIT",
    "BlueOak-1.0.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "CC-BY-4.0",
    "ISC",
    "MIT",
    "Python-2.0",
    "Unlicense",
  ]);
  const denied = [...packages].filter(([, license]) => !reviewed.has(license));
  if (denied.length > 0) {
    throw new Error(
      `Disallowed or unknown dependency licenses: ${denied.map(([name, license]) => `${name}: ${license}`).join(", ")}`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const packages = collectLicenses(
    resolve(import.meta.dirname, "../../node_modules/.pnpm"),
  );
  checkLicenses(packages);
  console.log(
    `Dependency license check passed (${packages.size} installed packages).`,
  );
}
