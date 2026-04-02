#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageDirs = new Map([
  ["ui-grab", "packages/grab"],
  ["ui-grab-mcp", "packages/mcp"],
]);

const rawArgs = process.argv.slice(2);
const dryRun = rawArgs.includes("--dry-run");
const selectedNames = rawArgs.filter((arg) => arg !== "--dry-run");
const packageNames =
  selectedNames.length > 0 ? selectedNames : [...packageDirs.keys()];

for (const packageName of packageNames) {
  if (!packageDirs.has(packageName)) {
    console.error(
      `Unknown package "${packageName}". Expected one of: ${[
        ...packageDirs.keys(),
      ].join(", ")}`,
    );
    process.exit(1);
  }
}

const readManifest = (packageName) => {
  const packageDir = packageDirs.get(packageName);
  if (!packageDir) {
    throw new Error(`Missing package directory for ${packageName}`);
  }

  const manifestPath = join(repoRoot, packageDir, "package.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  return {
    manifest,
    packageDir: join(repoRoot, packageDir),
  };
};

const publishedVersionExists = (name, version) => {
  try {
    const output = execFileSync(
      "npm",
      ["view", `${name}@${version}`, "version", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();

    if (!output) {
      return false;
    }

    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed.includes(version) : parsed === version;
  } catch {
    return false;
  }
};

for (const packageName of packageNames) {
  const { manifest, packageDir } = readManifest(packageName);
  const { name, version } = manifest;

  if (dryRun) {
    const packDir = mkdtempSync(join(tmpdir(), `${name.replace(/\//g, "-")}-`));

    try {
      console.log(`Packing ${name}@${version} from ${packageDir}`);
      execFileSync(
        "npm",
        ["pack", packageDir, "--json", "--pack-destination", packDir],
        {
          cwd: repoRoot,
          stdio: "inherit",
          env: process.env,
        },
      );
    } finally {
      rmSync(packDir, { force: true, recursive: true });
    }

    continue;
  }

  if (publishedVersionExists(name, version)) {
    console.log(`Skipping ${name}@${version}; that version is already on npm.`);
    continue;
  }

  const publishArgs = ["publish", packageDir, "--access", "public"];
  console.log(`Publishing ${name}@${version} from ${packageDir}`);

  execFileSync("npm", publishArgs, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
}
