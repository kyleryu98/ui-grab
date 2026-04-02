import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

test("packed package manifest does not leak workspace dependencies", () => {
  const packageRoot = path.resolve(import.meta.dirname, "..");
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "ui-grab-mcp-pack-"));

  try {
    const packResult = execFileSync(
      "npm",
      ["pack", "--json", "--pack-destination", tempRoot],
      {
        cwd: packageRoot,
        encoding: "utf8",
      },
    );
    const jsonMatch = packResult.match(/(?:^|\n)(\[\s*\{[\s\S]*\])\s*$/);
    assert.ok(jsonMatch, "npm pack did not return JSON output");

    const [{ filename }] = JSON.parse(jsonMatch[1]);

    execFileSync("tar", ["-xzf", path.join(tempRoot, filename)], {
      cwd: tempRoot,
    });

    const packedManifest = JSON.parse(
      readFileSync(path.join(tempRoot, "package", "package.json"), "utf8"),
    );

    assert.equal(packedManifest.dependencies["ui-grab"], packedManifest.version);
    assert.ok(
      !packedManifest.dependencies["ui-grab"].startsWith("workspace:"),
      "packed manifest still contains a workspace protocol dependency",
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
