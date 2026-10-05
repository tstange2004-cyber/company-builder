/**
 * Qualitätskontrolle für die statische Company-Builder-Website.
 * Prüft Seitenstruktur, interne Verweise und ungenutzte lokale Assets.
 */

import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDirectory = resolve(root, "assets");
const errors = [];
const sourceCache = new Map();
const usedAssets = new Set();

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : path;
  }));
  return nested.flat();
}

async function source(filePath) {
  if (!sourceCache.has(filePath)) sourceCache.set(filePath, await readFile(filePath, "utf8"));
  return sourceCache.get(filePath);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkReference(fromFile, reference, baseDirectory) {
  if (/^(?:https?:|mailto:|tel:|data:|javascript:|%23)/.test(reference)) return;

  const [pathPart, anchor] = reference.split("#");
  const targetPath = pathPart ? resolve(baseDirectory, pathPart) : fromFile;
  const label = relative(root, fromFile);

  if (targetPath.startsWith(`${assetsDirectory}${sep}`)) usedAssets.add(targetPath);
  if (!(await exists(targetPath))) {
    errors.push(`${label}: missing ${reference}`);
    return;
  }

  if (anchor && extname(targetPath) === ".html") {
    const target = await source(targetPath);
    if (!target.includes(`id="${anchor}"`)) {
      errors.push(`${label}: missing anchor ${relative(root, targetPath)}#${anchor}`);
    }
  }
}

const htmlFiles = (await readdir(root))
  .filter((file) => extname(file) === ".html")
  .map((file) => resolve(root, file));

for (const filePath of htmlFiles) {
  const markup = await source(filePath);
  const label = relative(root, filePath);
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  ids.filter((id, index) => ids.indexOf(id) !== index)
    .forEach((id) => errors.push(`${label}: duplicate id #${id}`));

  const h1Count = (markup.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) errors.push(`${label}: expected one h1, found ${h1Count}`);

  for (const image of markup.matchAll(/<img\s[^>]*>/g)) {
    if (!/\salt="[^"]*"/.test(image[0])) errors.push(`${label}: image without alt text`);
  }
  for (const link of markup.matchAll(/<a\s[^>]*target="_blank"[^>]*>/g)) {
    if (!/\srel="[^"]*noreferrer[^"]*"/.test(link[0])) {
      errors.push(`${label}: external target without noreferrer`);
    }
  }
  for (const match of markup.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    await checkReference(filePath, match[1], root);
  }
}

const assetFiles = await listFiles(assetsDirectory);
for (const filePath of assetFiles.filter((file) => extname(file) === ".css")) {
  const css = await source(filePath);
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    await checkReference(filePath, match[1], dirname(filePath));
  }
}

for (const asset of assetFiles) {
  if (!usedAssets.has(asset)) errors.push(`${relative(root, asset)}: unused asset`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`OK: ${htmlFiles.length} Seiten und ${assetFiles.length} Assets sind konsistent.`);
}
