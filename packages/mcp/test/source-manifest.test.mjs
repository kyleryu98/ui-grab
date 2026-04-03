import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

test("source manifest stays stable after build", () => {
  const packageRoot = path.resolve(import.meta.dirname, "..");
  const manifest = JSON.parse(
    readFileSync(path.join(packageRoot, "package.json"), "utf8"),
  );

  assert.equal(manifest.dependencies["ui-grab"], undefined);
  assert.equal(
    existsSync(path.join(packageRoot, ".package.json.backup")),
    false,
    "packaging backup should not be left behind after build",
  );
});

test("built client declarations stay self-contained", () => {
  const packageRoot = path.resolve(import.meta.dirname, "..");
  const clientTypes = readFileSync(
    path.join(packageRoot, "dist", "client.d.ts"),
    "utf8",
  );

  assert.doesNotMatch(clientTypes, /ui-grab\/core/);
});
