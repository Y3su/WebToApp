import { execFileSync } from "node:child_process";

const executable = process.platform === "win32" ? "cmd.exe" : "pnpm";
const args =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "pnpm licenses list --json"]
    : ["licenses", "list", "--json"];
const output = execFileSync(executable, args, {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

const report = JSON.parse(output);
const licenseNames = Object.keys(report);
const denied = licenseNames.filter((license) =>
  /(?:^|\W)(?:AGPL|GPL-[123](?!\.0-with-classpath)|SSPL|BUSL|UNLICENSED|UNKNOWN)/i.test(
    license,
  ),
);

if (denied.length > 0) {
  console.error(
    `Disallowed or unknown dependency licenses: ${denied.join(", ")}`,
  );
  process.exit(1);
}

console.log(
  `Dependency license check passed (${licenseNames.length} license groups).`,
);
