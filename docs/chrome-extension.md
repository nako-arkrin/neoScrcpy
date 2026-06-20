# chrome-extension

这是 neoScrcpy 的 Chrome MV3 扩展子项目。扩展使用 React、TypeScript 和 Vite 构建，主界面运行在 Chrome Side Panel 中，并提供弹窗、设置页、授权页和 PiP 小窗页面。

## 快速开始

```bash
npm install
npm run build
```

构建完成后，Chrome 可加载目录为：

```text
chrome-extension/dist
```

## 本地加载

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本目录下的 `dist` 文件夹。

## 目录说明

- `src/pages/`：扩展页面入口，包括 popup、sidepanel、permission、options、welcome、pip。
- `src/shared/`：WebADB、scrcpy、存储、主题、国际化和设备工具逻辑。
- `src/ui/`：通用 UI 组件与图标。
- `src/styles/`：全局样式。
- `src/assets/`：扩展内使用的图片资源。
- `vendor/scrcpy-server-v2.4`：随扩展分发的 scrcpy server。
- `scripts/postbuild.mjs`：构建后复制 manifest、图标、静态资源和 scrcpy server。

## 常用脚本

```bash
npm run dev
npm run build
npm run preview
```

- `npm run dev`：启动 Vite 开发服务，用于 UI 调试。
- `npm run build`：生成 Chrome 扩展产物。
- `npm run preview`：预览 Vite 产物。

修改源码后请重新执行 `npm run build`，并在 `chrome://extensions/` 中重新加载扩展。
