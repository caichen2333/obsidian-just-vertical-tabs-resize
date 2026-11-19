import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const versions = JSON.parse(await readFile("versions.json", "utf8"));
if (manifest.version !== pkg.version || versions[manifest.version] !== manifest.minAppVersion) {
  throw new Error("Package, manifest, and versions.json must describe the same release.");
}
const dist = resolve("dist");
await rm(dist, { recursive: true, force: true });
const pluginDir = resolve(dist, manifest.id);
await mkdir(pluginDir, { recursive: true });
const assets = ["main.js", "manifest.json", "styles.css"];
for (const asset of assets) {
  await copyFile(asset, resolve(dist, asset));
  await copyFile(asset, resolve(pluginDir, asset));
}
const zipName = `${manifest.id}-${manifest.version}.zip`;
execFileSync("zip", ["-X", "-q", zipName, ...assets.map((asset) => `${manifest.id}/${asset}`)], { cwd: dist });
const checksums = [];
for (const asset of [...assets, zipName]) {
  const data = await readFile(resolve(dist, asset));
  checksums.push(`${createHash("sha256").update(data).digest("hex")}  ${asset}`);
}
await writeFile(resolve(dist, "SHA256SUMS"), checksums.join("\n") + "\n");
console.log(`Packaged ${manifest.id} ${manifest.version} in dist/`);
