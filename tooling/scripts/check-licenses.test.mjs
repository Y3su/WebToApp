import assert from "node:assert/strict";
import test from "node:test";
import { checkLicenses, collectLicenses } from "./check-licenses.mjs";

test("permits existing permissive and reviewed LGPL expressions", () => {
  checkLicenses(
    new Map([
      ["example@1", "Apache-2.0 OR MIT"],
      ["image@1", "Apache-2.0 AND LGPL-3.0-or-later"],
    ]),
  );
});
test("rejects disallowed and unknown license declarations", () => {
  for (const license of [
    "GPL-3.0",
    "AGPL-3.0-only",
    "SSPL-1.0",
    "BUSL-1.1",
    "UNLICENSED",
    "UNKNOWN",
    "Proprietary",
    "MIT OR Custom-License",
    "",
  ]) {
    assert.throws(
      () => checkLicenses(new Map([["example@1", license]])),
      /Disallowed or unknown/,
    );
  }
});
test("missing install fails closed", () => {
  assert.throws(
    () => collectLicenses(new URL("./not-an-install", import.meta.url)),
    /ENOENT/,
  );
});
