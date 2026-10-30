// Starts an isolated copy of the Laravel API for the end-to-end tests (Playwright `webServer`):
//   1. resets the test database (bakht_stroy_test — the one Pest already wipes) and seeds the demo shop,
//   2. serves the API on http://127.0.0.1:8001.
// Safe for the developer's data and for real people: its own database, photos on the private "local" disk
// (not the shop's public folder), no Telegram bot or gateway (phone codes go to storage/logs/laravel.log),
// no WebSocket broadcasts, no e-mails.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { E2E_ADMIN, E2E_API_PORT } from "./config.ts";

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../backend");

/** php from PHP_BINARY, the PATH, or the WinGet install on Windows. */
function phpBinary() {
  if (process.env.PHP_BINARY) return process.env.PHP_BINARY;
  if (spawnSync("php", ["-v"], { stdio: "ignore", shell: process.platform === "win32" }).status === 0) return "php";
  const winget = path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Packages");
  const dir = existsSync(winget) ? readdirSync(winget).find((name) => name.startsWith("PHP.PHP")) : undefined;
  if (dir) return path.join(winget, dir, "php.exe");
  throw new Error("PHP not found: set PHP_BINARY to the php executable.");
}

if (existsSync(path.join(backend, "bootstrap", "cache", "config.php"))) {
  throw new Error("backend/bootstrap/cache/config.php exists: run `php artisan config:clear`, cached config would ignore the E2E settings.");
}

const env = {
  ...process.env,
  APP_ENV: "local",
  APP_DEBUG: "true",
  APP_URL: `http://127.0.0.1:${E2E_API_PORT}`,
  DB_DATABASE: "bakht_stroy_test",
  CACHE_STORE: "array",
  SESSION_DRIVER: "array",
  QUEUE_CONNECTION: "sync",
  BROADCAST_CONNECTION: "log",
  MAIL_MAILER: "log",
  LOG_CHANNEL: "single",
  TELEGRAM_CODES_DRIVER: "log",
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_GATEWAY_TOKEN: "",
  MEDIA_DISK: "local",
  FILESYSTEM_DISK: "local",
  ADMIN_EMAIL: E2E_ADMIN.email,
  ADMIN_PASSWORD: E2E_ADMIN.password,
  ADMIN_PHONE: "",
};

const php = phpBinary();
const artisan = (...args) => spawnSync(php, ["artisan", ...args, "--no-interaction"], { cwd: backend, env, encoding: "utf8" });

// Seeding the demo shop (90 products with generated pictures) takes minutes, so it happens once:
// later runs keep the data (each test makes its own customer and order). E2E_RESET=1 starts from scratch;
// an empty catalog (e.g. after the Pest suite emptied the test database) is seeded again automatically.
const migrate = artisan("migrate", "--force");
const count = artisan("tinker", "--execute=echo App\\Modules\\Catalog\\Models\\Product::query()->count();");
const products = Number.parseInt(String(count.stdout).trim().split(/\s+/).at(-1) ?? "", 10);

if (process.env.E2E_RESET === "1" || migrate.status !== 0 || !(products > 0)) {
  console.log("[e2e] resetting and seeding bakht_stroy_test (first run: several minutes)…");
  const seed = spawnSync(php, ["artisan", "migrate:fresh", "--seed", "--force", "--no-interaction"], { cwd: backend, env, stdio: "inherit" });
  if (seed.status !== 0) process.exit(seed.status ?? 1);
} else {
  console.log(`[e2e] test database ready (${products} products) — set E2E_RESET=1 to reseed`);
  // The administrator from E2E_ADMIN, whatever happened to the data in between.
  artisan("admin:seed");
}

console.log(`[e2e] API on http://127.0.0.1:${E2E_API_PORT}`);
const router = path.join(backend, "vendor", "laravel", "framework", "src", "Illuminate", "Foundation", "resources", "server.php");
// Like `artisan serve`: the router looks for index.php in the current directory, so the server runs from public/.
const server = spawn(php, ["-S", `127.0.0.1:${E2E_API_PORT}`, router], { cwd: path.join(backend, "public"), env, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill());
server.on("exit", (code) => process.exit(code ?? 0));
