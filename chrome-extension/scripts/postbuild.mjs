import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.resolve(root, "dist");

fs.copyFileSync(path.resolve(root, "manifest.json"), path.resolve(dist, "manifest.json"));

const iconSrc = path.resolve(root, "neoscrcpy.png");
const iconDist = path.resolve(dist, "neoscrcpy.png");
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, iconDist);
}

const scrcpyServerSrc = path.resolve(root, "vendor", "scrcpy-server-v2.4");
const scrcpyServerDist = path.resolve(dist, "scrcpy-server-v2.4");
if (fs.existsSync(scrcpyServerSrc)) {
  fs.copyFileSync(scrcpyServerSrc, scrcpyServerDist);
  console.log("Copied scrcpy-server-v2.4");
} else {
  console.warn("Warning: scrcpy-server-v2.4 not found at:", scrcpyServerSrc);
  console.warn("  The extension may not work properly without the scrcpy server file.");
}

const guideImages = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png"];
let copiedCount = 0;
for (const name of guideImages) {
  const src = path.resolve(root, "src", "assets", name);
  const dest = path.resolve(dist, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    copiedCount++;
  }
}
console.log(`Copied ${copiedCount}/${guideImages.length} guide images`);
