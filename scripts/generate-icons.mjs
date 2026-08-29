/**
 * Generate all PWA / favicon PNGs from the source SVG icons in /public.
 * Run once (or whenever the source changes) with:  node scripts/generate-icons.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const publicDir = join(root, "public");
const appDir = join(root, "src", "app");

if (!existsSync(publicDir)) await mkdir(publicDir, { recursive: true });

const iconSvg = await readFile(join(publicDir, "icon-source.svg"));
const maskableSvg = await readFile(join(publicDir, "icon-maskable-source.svg"));

async function png(svg, size, out) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("✓", out.replace(root + "/", ""));
}

// Manifest / browser icons
await png(iconSvg, 192, join(publicDir, "icon-192.png"));
await png(iconSvg, 512, join(publicDir, "icon-512.png"));
await png(maskableSvg, 192, join(publicDir, "icon-maskable-192.png"));
await png(maskableSvg, 512, join(publicDir, "icon-maskable-512.png"));

// iOS home-screen icon (fixed 180x180)
await png(iconSvg, 180, join(publicDir, "apple-touch-icon.png"));

// Browser tab favicons — App Router auto-picks these up from src/app/
await png(iconSvg, 32, join(appDir, "icon.png"));
await png(iconSvg, 180, join(appDir, "apple-icon.png"));

console.log("\nAll icons generated.");
