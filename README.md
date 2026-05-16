# browser-scrcpy

browser-scrcpy is a Chrome MV3 extension for Android screen mirroring and control through WebADB/WebUSB and scrcpy.

The active extension project lives in `chrome-extension/`. Build-time extension assets are kept inside that directory so the repository can be uploaded without local reference projects or generated packages.

## Project layout

- `chrome-extension/` - Chrome extension source, Vite config, manifest, and package metadata.
- `chrome-extension/src/` - React + TypeScript extension UI and shared WebADB/scrcpy code.
- `chrome-extension/src/assets/` - Guide, welcome, and UI image assets.
- `chrome-extension/vendor/scrcpy-server-v2.4` - scrcpy server binary copied into the extension package.
- `chrome-extension/scripts/postbuild.mjs` - Copies the manifest, icon, guide images, and scrcpy server into `chrome-extension/dist`.

## Requirements

- Node.js 18+
- npm
- Chrome 116+ with WebUSB support
- Android device with USB debugging enabled

## Build

```bash
cd chrome-extension
npm install
npm run build
```

The installable unpacked extension is generated at:

```text
chrome-extension/dist
```

## Load in Chrome

1. Open `chrome://extensions/`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `chrome-extension/dist`.

## GitHub upload checklist

- Do commit `package-lock.json`, source files, `chrome-extension/src/assets/`, `chrome-extension/vendor/`, and build scripts.
- Do not commit `node_modules/`, `chrome-extension/dist/`, `*.crx`, `*.zip`, `.env*`, or `*.pem`.
- Choose and add a `LICENSE` file before publishing as an open-source repository.
- Run `npm run build` from `chrome-extension/` before tagging or publishing a release.

## Package release

After a successful build, package only the contents of `chrome-extension/dist/` for manual distribution or Chrome Web Store submission. Keep signing keys such as `*.pem` outside Git.
