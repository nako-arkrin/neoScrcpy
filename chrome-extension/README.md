# chrome-extension

neoScrcpy 的 Chrome 扩展（MV3），以 Side Panel 作为主要 UI，并提供 action 小窗口与独立授权页面。

## 目录

- `src/`：源码（React + TypeScript + Vite）
- `dist/`：构建产物（加载到 Chrome 的目录）
- `manifest.json`：用于构建拷贝到 `dist/` 的清单

## 本地加载

1. 打开 Chrome：`chrome://extensions`
2. 右上角打开「开发者模式」
3. 在本目录安装依赖并构建：
   - `npm install`
   - `npm run build`
4. 点击「加载已解压的扩展程序」
5. 选择目录：`chrome-extension/dist`
