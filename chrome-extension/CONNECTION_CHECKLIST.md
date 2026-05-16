# 连接问题快速检查清单 / Quick Connection Checklist

## 🔍 问题诊断 / Problem Diagnosis

### 第一步：确认基本环境 / Step 1: Confirm Basic Environment

- [ ] Chrome 版本 ≥ 116
- [ ] 手机已开启 USB 调试
- [ ] USB 数据线连接正常
- [ ] 手机屏幕已解锁

---

- [ ] Chrome version ≥ 116
- [ ] USB debugging enabled on phone
- [ ] USB cable connected properly
- [ ] Phone screen unlocked

---

### 第二步：检查权限配置 / Step 2: Check Permissions

#### manifest.json 应该包含 / manifest.json should contain:

```json
{
  "permissions": [
    "storage",
    "sidePanel", 
    "tabs",
    "windows",
    "contextMenus"
  ]
}
```

#### ❌ 不应该有 / Should NOT have:
```json
{
  "host_permissions": ["*://*/*"]  // 删除这个！/ Remove this!
}
```

**原因 / Reason:**
- WebUSB 是浏览器原生 API，不需要 host_permissions
- WebUSB is a native browser API, doesn't need host_permissions
- host_permissions 可能导致权限冲突
- host_permissions may cause permission conflicts

---

### 第三步：快速修复步骤 / Step 3: Quick Fix Steps

#### 🔄 重置连接 / Reset Connection

1. **拔出 USB 线 / Unplug USB**
   ```
   等待 3 秒 / Wait 3 seconds
   ```

2. **重新插入 / Plug back in**
   ```
   确保听到连接提示音 / Ensure you hear connection sound
   ```

3. **手机上确认 / Confirm on phone**
   ```
   如果弹出授权对话框，点击"允许"
   If authorization dialog appears, click "Allow"
   ```

#### 🔧 重置 USB 调试 / Reset USB Debugging

```
手机设置 / Phone Settings:
1. 开发者选项 → 撤销 USB 调试授权
   Developer Options → Revoke USB debugging authorizations
   
2. 关闭 USB 调试
   Turn off USB debugging
   
3. 等待 5 秒 / Wait 5 seconds
   
4. 重新开启 USB 调试
   Turn on USB debugging again
   
5. 重新连接 USB
   Reconnect USB
```

#### 🌐 重置浏览器 / Reset Browser

```
1. 关闭所有 Chrome 窗口
   Close all Chrome windows
   
2. 访问 chrome://restart
   Visit chrome://restart
   
3. 重新打开扩展
   Reopen extension
```

---

### 第四步：检查冲突程序 / Step 4: Check Conflicting Programs

#### Windows 用户 / Windows Users:

```powershell
# 检查是否有其他 ADB 进程
# Check for other ADB processes
tasklist | findstr adb

# 如果有，结束它们
# If found, kill them
taskkill /F /IM adb.exe
```

#### 常见冲突程序 / Common Conflicting Programs:

- [ ] Android Studio
- [ ] scrcpy 桌面版 / scrcpy desktop
- [ ] 手机助手 / Phone assistants
  - 华为手机助手 / Huawei HiSuite
  - 小米助手 / Mi PC Suite
  - OPPO 手机助手 / OPPO PC Suite
  - vivo 助手 / vivo PC Suite
- [ ] ADB 命令行工具 / ADB command line tools

**解决方案 / Solution:**
```
关闭所有这些程序后再尝试连接
Close all these programs before connecting
```

---

### 第五步：验证扩展状态 / Step 5: Verify Extension Status

#### 检查扩展是否正确加载 / Check if extension loaded correctly:

```
1. 访问 chrome://extensions/
   Visit chrome://extensions/
   
2. 找到 neoScrcpy
   Find neoScrcpy
   
3. 确认：
   Confirm:
   - ✅ 已启用 / Enabled
   - ✅ 无错误提示 / No error messages
   - ✅ service worker 状态正常 / service worker status normal
```

#### 如果有错误 / If there are errors:

```
1. 点击"重新加载" / Click "Reload"
2. 如果仍有错误，点击"删除" / If still errors, click "Remove"
3. 重新构建并加载 / Rebuild and reload:
   npm run build
   然后重新加载 dist 文件夹 / Then reload dist folder
```

---

### 第六步：测试 WebUSB 可用性 / Step 6: Test WebUSB Availability

#### 在浏览器控制台运行 / Run in browser console:

```javascript
// 测试 WebUSB 是否可用
// Test if WebUSB is available
console.log('WebUSB available:', !!navigator.usb);

// 测试获取已授权设备
// Test getting authorized devices
navigator.usb.getDevices().then(devices => {
  console.log('Authorized devices:', devices.length);
  devices.forEach(d => console.log('Device:', d.productName, d.serialNumber));
});

// 测试 WebCodecs
// Test WebCodecs
console.log('VideoDecoder available:', typeof VideoDecoder !== 'undefined');

// 测试 WebGL
// Test WebGL
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log('WebGL available:', !!gl);
```

**期望输出 / Expected output:**
```
WebUSB available: true
VideoDecoder available: true
WebGL available: true
Authorized devices: 0 或更多 / 0 or more
```

---

## 🚨 紧急修复 / Emergency Fix

### 如果以上都不行 / If nothing above works:

#### 完全重置 / Complete Reset

```bash
# 1. 完全卸载扩展
# 1. Completely uninstall extension
chrome://extensions/ → 删除 neoScrcpy / Remove neoScrcpy

# 2. 清除浏览器数据
# 2. Clear browser data
chrome://settings/clearBrowserData
选择"全部时间" / Select "All time"
勾选所有选项 / Check all options

# 3. 重启浏览器
# 3. Restart browser
完全关闭后重新打开 / Close completely then reopen

# 4. 重新构建扩展
# 4. Rebuild extension
cd chrome-extension
npm run build

# 5. 重新加载扩展
# 5. Reload extension
chrome://extensions/ → 加载已解压的扩展程序 / Load unpacked
```

#### 检查 manifest.json

```bash
# 确保 manifest.json 正确
# Ensure manifest.json is correct
cat chrome-extension/dist/manifest.json
```

**应该看到 / Should see:**
```json
{
  "manifest_version": 3,
  "name": "neoScrcpy",
  "version": "0.1.1",
  "permissions": ["storage", "sidePanel", "tabs", "windows", "contextMenus"]
}
```

**不应该有 / Should NOT have:**
```json
"host_permissions": ["*://*/*"]
```

---

## ✅ 成功连接的标志 / Signs of Successful Connection

### 你应该看到 / You should see:

1. **授权页面 / Permission Page**
   ```
   - 弹出设备选择对话框
   - Device selection dialog appears
   - 显示你的手机型号
   - Shows your phone model
   ```

2. **连接过程 / Connection Process**
   ```
   - "正在连接 ADB..." / "Connecting to ADB..."
   - "已连接 ADB，正在启动 Scrcpy..." / "Connected to ADB, starting Scrcpy..."
   - "Scrcpy 已启动，正在初始化解码器..." / "Scrcpy started, initializing decoder..."
   - "镜像已启动" / "Mirroring active"
   ```

3. **最终状态 / Final State**
   ```
   - 侧边栏显示手机屏幕
   - Side panel shows phone screen
   - 可以触摸控制
   - Touch control works
   - 可以键盘输入
   - Keyboard input works
   ```

---

## 📝 记录问题 / Log Issues

### 如果仍然无法连接 / If still cannot connect:

#### 收集以下信息 / Collect this information:

```
1. Chrome 版本 / Chrome version:
   chrome://version

2. 操作系统 / Operating system:
   Windows / macOS / Linux

3. 手机信息 / Phone info:
   - 品牌型号 / Brand and model:
   - Android 版本 / Android version:

4. 错误信息 / Error message:
   - 完整的错误文本 / Complete error text
   - 控制台日志 / Console logs

5. manifest.json 内容 / manifest.json content:
   cat chrome-extension/dist/manifest.json

6. 已尝试的步骤 / Steps tried:
   - [ ] 重新插拔 USB
   - [ ] 重置 USB 调试
   - [ ] 关闭冲突程序
   - [ ] 重新加载扩展
   - [ ] 完全重置
```

---

## 🎯 最常见的问题和解决方案 / Most Common Issues and Solutions

| 问题 / Issue | 原因 / Cause | 解决方案 / Solution |
|-------------|-------------|-------------------|
| 找不到设备 / Device not found | USB 调试未开启 / USB debugging off | 开启 USB 调试 / Enable USB debugging |
| 连接失败 / Connection failed | 其他程序占用 / Other programs using ADB | 关闭冲突程序 / Close conflicting programs |
| 立即断开 / Disconnects immediately | USB 线质量差 / Poor USB cable | 更换数据线 / Replace cable |
| Scrcpy 启动失败 / Scrcpy fails | 权限不足 / Insufficient permissions | 检查手机权限 / Check phone permissions |
| 权限错误 / Permission error | manifest.json 配置错误 / Wrong manifest.json | 移除 host_permissions / Remove host_permissions |

---

## 💡 专业提示 / Pro Tips

1. **使用原装数据线 / Use Original Cable**
   - 质量好的数据线可以避免 90% 的连接问题
   - Quality cables prevent 90% of connection issues

2. **保持手机解锁 / Keep Phone Unlocked**
   - 连接时确保手机屏幕亮着
   - Ensure phone screen is on during connection

3. **关闭省电模式 / Disable Battery Saver**
   - 省电模式可能限制 USB 功能
   - Battery saver may limit USB functionality

4. **使用 USB 3.0 端口 / Use USB 3.0 Port**
   - 更快的传输速度，更稳定的连接
   - Faster transfer, more stable connection

5. **定期清理 / Regular Cleanup**
   - 每周清理一次浏览器缓存
   - Clear browser cache weekly
   - 每月重置一次 USB 调试授权
   - Reset USB debugging authorization monthly
