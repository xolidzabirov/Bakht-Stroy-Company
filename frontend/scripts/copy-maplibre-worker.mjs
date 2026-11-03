/**
 * MapLibre 6 does its work in a Web Worker loaded from separate files, and Turbopack does not bundle them.
 * They are copied to public/ into a folder named after the version (safe for the browser cache);
 * the map finds them with setWorkerUrl. Runs by itself before `dev` and `build`.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("maplibre-gl/package.json");
const { version } = JSON.parse(readFileSync(packagePath, "utf8"));
const dist = path.join(path.dirname(packagePath), "dist");
const out = path.join(import.meta.dirname, "..", "public", "vendor", "maplibre", version);

mkdirSync(out, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  const from = path.join(dist, file);
  if (!existsSync(from)) throw new Error(`maplibre-gl: ${file} not found (${from})`);
  copyFileSync(from, path.join(out, file));
}
console.log(`maplibre-gl ${version} worker -> public/vendor/maplibre/${version}/`);
