import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mcpRoot = path.resolve(__dirname, "..");
const uiGrabPackageJsonPath = path.resolve(mcpRoot, "../grab/package.json");
const mcpPackageJsonPath = path.join(mcpRoot, "package.json");

const uiGrabPackage = JSON.parse(
  fs.readFileSync(uiGrabPackageJsonPath, "utf8"),
);
const mcpPackage = JSON.parse(fs.readFileSync(mcpPackageJsonPath, "utf8"));

mcpPackage.version = uiGrabPackage.version;
mcpPackage.dependencies = {
  ...mcpPackage.dependencies,
  "ui-grab": uiGrabPackage.version,
};

fs.writeFileSync(
  mcpPackageJsonPath,
  JSON.stringify(mcpPackage, null, 2) + "\n",
);
