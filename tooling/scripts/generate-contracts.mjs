import { readFile, writeFile, mkdir } from "node:fs/promises";
import { format } from "prettier";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import {
  quicktype,
  InputData,
  JSONSchemaInput,
  JSONSchemaStore,
} from "quicktype-core";

const root = resolve(import.meta.dirname, "../..");
const formatting = JSON.parse(
  await readFile(resolve(root, ".prettierrc.json"), "utf8"),
);
async function emit(path, content) {
  if (process.argv.includes("--check")) {
    const existing = await readFile(path, "utf8");
    if (existing.replaceAll("\r\n", "\n") !== content)
      throw new Error("Stale generated file: " + path);
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
}
const schema = await readFile(
  resolve(root, "packages/app-spec/src/app-spec-v1.schema.json"),
  "utf8",
);
const input = new JSONSchemaInput(new JSONSchemaStore());
await input.addSource({ name: "AppSpecV1", schema });
const inputData = new InputData();
inputData.addInput(input);
for (const [lang, file, rendererOptions] of [
  ["typescript", "AppSpecV1.ts", { "just-types": "true" }],
  ["rust", "app_spec_v1.rs", { visibility: "public" }],
  ["swift", "AppSpecV1.swift", { "access-level": "public" }],
  [
    "kotlin",
    "AppSpecV1.kt",
    { framework: "just-types", package: "dev.webtoapp.contract" },
  ],
]) {
  const result = await quicktype({ inputData, lang, rendererOptions });
  const path = resolve(root, "packages/app-spec/generated", file);
  let text = result.lines.join("\n").trimEnd() + "\n";
  if (lang === "rust")
    text = execFileSync("rustfmt", ["--edition", "2021"], {
      input: text,
      encoding: "utf8",
    }).replaceAll("\r\n", "\n");
  await emit(
    path,
    lang === "typescript"
      ? await format(text, { ...formatting, parser: "typescript" })
      : text,
  );
}

// Development resources are derived from the same fixture; they grant no native methods.
const spec = JSON.parse(
  await readFile(
    resolve(root, "packages/app-spec/examples/url-app.json"),
    "utf8",
  ),
);
spec.source.startUrl = "https://example.com";
spec.identity.displayName = "WebToApp Preview";
spec.navigation.native = { mode: "none", items: [] };
for (const capability of Object.keys(spec.capabilities))
  spec.capabilities[capability] = { enabled: false };
spec.release = { channel: "internal", updatePolicy: "manual" };
for (const destination of [
  "runtimes/desktop/src-tauri/resources/appspec.json",
  "runtimes/android/app/src/main/assets/appspec.json",
  "runtimes/ios/WebToApp/Resources/appspec.json",
]) {
  const path = resolve(root, destination);
  await emit(
    path,
    await format(JSON.stringify(spec), { ...formatting, parser: "json" }),
  );
}
await emit(
  resolve(root, "runtimes/ios/WebToApp/AppSpecV1.generated.swift"),
  await readFile(
    resolve(root, "packages/app-spec/generated/AppSpecV1.swift"),
    "utf8",
  ),
);
console.log(
  "Generated four language contracts and development runtime resources.",
);
