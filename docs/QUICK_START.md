# 快速开始 / Quick Start

## 构建扩展 / Build Extension

```bash
cd chrome-extension
npm install
npm run build
```

构建完成后，`dist` 文件夹将包含可安装的扩展文件。

After building, the `dist` folder will contain the installable extension files.

## 安装扩展 / Install Extension

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启"开发者模式"（右上角）
3. 点击"加载已解压的扩展程序"
4. 选择 `chrome-extension/dist` 文件夹

---

1. Open Chrome browser, visit `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `chrome-extension/dist` folder

## 使用扩展 / Use Extension

### 方法 1: 右键菜单（推荐）/ Method 1: Context Menu (Recommended)

1. 在任何网页上右键点击
2. 选择"打开 neoScrcpy 侧边栏"
3. 侧边栏将自动打开

---

1. Right-click on any webpage
2. Select "Open neoScrcpy Side Panel"
3. Side panel will open automatically

### 方法 2: 扩展图标 / Method 2: Extension Icon

1. 点击浏览器工具栏中的 neoScrcpy 图标
2. 在弹出窗口中点击"打开侧边栏"

---

1. Click the neoScrcpy icon in browser toolbar
2. Click "Open Side Panel" in the popup

## 连接设备 / Connect Device

### 首次连接 / First Time Connection

1. 打开侧边栏
2. 点击"连接设备"
3. 在授权页面选择你的 Android 设备
4. 在手机上确认 USB 调试授权

---

1. Open side panel
2. Click "Connect device"
3. Select your Android device on permission page
4. Confirm USB debugging on your phone

### 快速重连 / Quick Reconnect

如果之前已连接过设备，可以：
- 在"最近设备"列表中点击设备名称
- 或者直接点击"连接设备"自动连接上次的设备

---

If you've connected before:
- Click device name in "Recent devices" list
- Or click "Connect device" to auto-connect last device

## 功能特性 / Features

### ✨ 右键菜单 / Context Menu
- 快速打开侧边栏
- Quick access to side panel
- 支持中英文
- Chinese/English support

### 📱 设备镜像 / Device Mirroring
- 实时显示手机屏幕
- Real-time phone screen display
- 触摸控制
- Touch control
- 键盘输入
- Keyboard input

### 🎨 主题切换 / Theme Switching
- 浅色/深色/跟随系统
- Light/Dark/System
- Material Design 3
- Material Design 3

### 🌍 多语言 / Multi-language
- 简体中文
- Simplified Chinese
- English (US)
- English (US)

## 故障排除 / Troubleshooting

### 找不到设备 / Can't Find Device

1. 确保手机已开启 USB 调试
2. 重新插拔 USB 数据线
3. 在手机上重新授权 USB 调试
4. 点击"重置连接状态"

---

1. Ensure USB debugging is enabled on phone
2. Replug USB cable
3. Re-authorize USB debugging on phone
4. Click "Reset connection"

### 连接失败 / Connection Failed

1. 关闭其他使用 ADB 的程序（如手机助手）
2. 检查 USB 驱动是否正确安装（Windows）
3. 尝试使用不同的 USB 端口
4. 重启浏览器

---

1. Close other ADB programs (like phone assistants)
2. Check if USB drivers are installed (Windows)
3. Try different USB port
4. Restart browser

### 右键菜单不显示 / Context Menu Not Showing

1. 刷新页面
2. 检查扩展是否已启用
3. 重新加载扩展

---

1. Refresh page
2. Check if extension is enabled
3. Reload extension

## 开发调试 / Development

### 开发模式 / Development Mode

```bash
npm run dev
```

### 查看日志 / View Logs

1. 打开 `chrome://extensions/`
2. 找到 neoScrcpy 扩展
3. 点击"service worker"查看后台日志
4. 在侧边栏中右键 → 检查，查看前端日志

---

1. Open `chrome://extensions/`
2. Find neoScrcpy extension
3. Click "service worker" to view background logs
4. Right-click in side panel → Inspect for frontend logs

## 更多信息 / More Information

- [BUG 修复记录](./BUG_FIXES.md)
- [右键菜单功能说明](./CONTEXT_MENU_FEATURE.md)
- [Bug Fix Log](./BUG_FIXES.md)
- [Context Menu Feature](./CONTEXT_MENU_FEATURE.md)

## 系统要求 / System Requirements

- Chrome 浏览器 116+ / Chrome 116+
- 支持 WebUSB 的操作系统 / OS with WebUSB support
- Android 5.0+ 设备 / Android 5.0+ device
- USB 数据线 / USB cable

## 许可证 / License

请查看项目根目录的 LICENSE 文件。

Please see LICENSE file in project root.
