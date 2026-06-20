# 故障排除指南 / Troubleshooting Guide

## 无法连接设备 / Cannot Connect Device

### 问题 1: 找不到设备 / Device Not Found

#### 症状 / Symptoms
- 点击"连接设备"后，弹出窗口中没有显示设备
- No device shown in popup after clicking "Connect device"

#### 解决方案 / Solutions

**1. 检查 USB 调试是否开启 / Check USB Debugging**
```
手机设置 → 开发者选项 → USB 调试（开启）
Phone Settings → Developer Options → USB Debugging (Enable)
```

**2. 检查 USB 连接模式 / Check USB Connection Mode**
- 确保使用"文件传输"或"MTP"模式，而不是"仅充电"
- Ensure using "File Transfer" or "MTP" mode, not "Charging only"

**3. 重新插拔 USB 线 / Replug USB Cable**
- 拔出 USB 线等待 3 秒后重新插入
- Unplug USB cable, wait 3 seconds, then plug back in

**4. 检查 USB 线和端口 / Check USB Cable and Port**
- 使用原装数据线或质量好的数据线
- Use original or high-quality USB cable
- 尝试不同的 USB 端口
- Try different USB ports
- 避免使用 USB Hub
- Avoid using USB hubs

**5. 重启 ADB 授权 / Restart ADB Authorization**
```
手机上：
1. 设置 → 开发者选项 → 撤销 USB 调试授权
2. 关闭 USB 调试
3. 重新开启 USB 调试
4. 重新连接

On Phone:
1. Settings → Developer Options → Revoke USB debugging authorizations
2. Turn off USB debugging
3. Turn on USB debugging again
4. Reconnect
```

---

### 问题 2: 连接失败 / Connection Failed

#### 症状 / Symptoms
- 能看到设备但连接失败
- Device is visible but connection fails
- 显示错误信息
- Error message displayed

#### 解决方案 / Solutions

**1. 关闭其他 ADB 程序 / Close Other ADB Programs**

检查并关闭以下程序：
Check and close these programs:
- 手机助手（如华为手机助手、小米助手等）
- Phone assistants (Huawei, Xiaomi, etc.)
- Android Studio
- scrcpy 桌面版
- scrcpy desktop version
- 其他使用 ADB 的工具
- Other ADB tools

**Windows 用户 / Windows Users:**
```powershell
# 检查 adb.exe 进程
tasklist | findstr adb

# 结束 adb 进程
taskkill /F /IM adb.exe
```

**2. 检查驱动程序（Windows）/ Check Drivers (Windows)**

确保安装了正确的 USB 驱动：
Ensure correct USB drivers are installed:

- 使用设备管理器检查设备状态
- Check device status in Device Manager
- 如果显示黄色感叹号，需要更新驱动
- If yellow exclamation mark appears, update driver
- 下载并安装手机厂商提供的驱动
- Download and install drivers from phone manufacturer

**3. 重置浏览器 USB 状态 / Reset Browser USB State**

```
1. 关闭所有 Chrome 窗口
2. 重新打开 Chrome
3. 访问 chrome://restart
4. 重新尝试连接

1. Close all Chrome windows
2. Reopen Chrome
3. Visit chrome://restart
4. Try connecting again
```

**4. 清除浏览器缓存 / Clear Browser Cache**

```
1. chrome://settings/clearBrowserData
2. 选择"缓存的图片和文件"
3. 点击"清除数据"
4. 重新加载扩展

1. chrome://settings/clearBrowserData
2. Select "Cached images and files"
3. Click "Clear data"
4. Reload extension
```

---

### 问题 3: 连接后立即断开 / Disconnects Immediately After Connection

#### 症状 / Symptoms
- 连接成功但几秒后断开
- Connects successfully but disconnects after seconds
- 显示"设备已断开"
- Shows "Device disconnected"

#### 解决方案 / Solutions

**1. 检查手机电源管理 / Check Phone Power Management**

```
关闭以下设置：
Disable these settings:

- USB 调试时保持唤醒
- Stay awake while USB debugging
- 省电模式
- Battery saver mode
- 后台进程限制
- Background process limit
```

**2. 检查 USB 线质量 / Check USB Cable Quality**

- 使用原装或认证的数据线
- Use original or certified cable
- 避免使用过长的延长线
- Avoid using long extension cables
- 检查接口是否松动
- Check if connector is loose

**3. 更新手机系统 / Update Phone System**

- 某些旧版本系统可能有 ADB 兼容性问题
- Some old system versions may have ADB compatibility issues
- 更新到最新系统版本
- Update to latest system version

---

### 问题 4: Scrcpy 启动失败 / Scrcpy Start Failed

#### 症状 / Symptoms
- ADB 连接成功但 Scrcpy 无法启动
- ADB connects but Scrcpy fails to start
- 显示"Scrcpy 服务启动失败"
- Shows "Failed to start scrcpy server"

#### 解决方案 / Solutions

**1. 检查手机存储空间 / Check Phone Storage**

- 确保手机有足够的存储空间（至少 100MB）
- Ensure phone has enough storage (at least 100MB)
- 清理临时文件
- Clean temporary files

**2. 检查手机权限 / Check Phone Permissions**

```
某些手机需要额外权限：
Some phones require additional permissions:

- 显示悬浮窗权限
- Display over other apps permission
- 后台运行权限
- Background running permission
```

**3. 重启手机 / Restart Phone**

- 完全关机后重新开机
- Power off completely then restart
- 不要使用"重启"功能
- Don't use "Restart" function

**4. 检查 scrcpy-server 文件 / Check scrcpy-server File**

```bash
# 重新构建扩展
npm run build

# 检查 dist 文件夹中是否有 scrcpy-server-v2.4 文件
# Check if scrcpy-server-v2.4 exists in dist folder
```

---

## 浏览器兼容性问题 / Browser Compatibility Issues

### 问题: 显示"不兼容" / Shows "Incompatible"

#### 检查项 / Checklist

**1. Chrome 版本 / Chrome Version**
```
需要 Chrome 116 或更高版本
Requires Chrome 116 or higher

检查版本：chrome://version
Check version: chrome://version
```

**2. WebUSB 支持 / WebUSB Support**
```javascript
// 在控制台测试
// Test in console
console.log('WebUSB:', !!navigator.usb);
// 应该显示 true / Should show true
```

**3. WebCodecs 支持 / WebCodecs Support**
```javascript
// 在控制台测试
// Test in console
console.log('VideoDecoder:', typeof VideoDecoder !== 'undefined');
// 应该显示 true / Should show true
```

**4. WebGL 支持 / WebGL Support**
```javascript
// 在控制台测试
// Test in console
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log('WebGL:', !!gl);
// 应该显示 true / Should show true
```

---

## 权限问题 / Permission Issues

### 问题: 无法授予 USB 权限 / Cannot Grant USB Permission

#### 解决方案 / Solutions

**1. 检查浏览器权限设置 / Check Browser Permission Settings**

```
chrome://settings/content/usbDevices

确保：
Ensure:
- 允许网站请求访问 USB 设备
- Allow sites to request access to USB devices
- neoScrcpy 扩展未被阻止
- neoScrcpy extension is not blocked
```

**2. 重置扩展权限 / Reset Extension Permissions**

```
1. chrome://extensions/
2. 找到 neoScrcpy
3. 点击"详细信息"
4. 滚动到"权限"部分
5. 确认所有权限已启用

1. chrome://extensions/
2. Find neoScrcpy
3. Click "Details"
4. Scroll to "Permissions" section
5. Confirm all permissions are enabled
```

**3. 清除站点权限 / Clear Site Permissions**

```
1. chrome://settings/content/all
2. 搜索 "chrome-extension://"
3. 删除相关权限
4. 重新授权

1. chrome://settings/content/all
2. Search for "chrome-extension://"
3. Remove related permissions
4. Re-authorize
```

---

## 性能问题 / Performance Issues

### 问题: 画面卡顿 / Screen Lag

#### 解决方案 / Solutions

**1. 降低分辨率 / Lower Resolution**
- 当前默认最大分辨率：1024px
- Current default max resolution: 1024px
- 可以在代码中调整 `maxSize` 参数
- Can adjust `maxSize` parameter in code

**2. 检查 CPU 使用率 / Check CPU Usage**
- 关闭其他占用 CPU 的程序
- Close other CPU-intensive programs
- 使用硬件加速
- Use hardware acceleration

**3. 检查 USB 连接 / Check USB Connection**
- 使用 USB 3.0 端口
- Use USB 3.0 port
- 避免使用 USB Hub
- Avoid USB hubs

---

## 调试技巧 / Debugging Tips

### 查看日志 / View Logs

**1. 后台服务日志 / Background Service Logs**
```
1. chrome://extensions/
2. 找到 neoScrcpy
3. 点击 "service worker"
4. 查看控制台输出

1. chrome://extensions/
2. Find neoScrcpy
3. Click "service worker"
4. View console output
```

**2. 侧边栏日志 / Side Panel Logs**
```
1. 打开侧边栏
2. 在侧边栏中右键
3. 选择"检查"
4. 查看控制台

1. Open side panel
2. Right-click in side panel
3. Select "Inspect"
4. View console
```

**3. 手机 Logcat（高级）/ Phone Logcat (Advanced)**
```bash
# 如果有 adb 命令行工具
# If you have adb command line tool
adb logcat -s scrcpy
```

---

## 常见错误信息 / Common Error Messages

### "USB transfer interrupted"
- **原因 / Cause:** USB 连接不稳定
- **解决 / Solution:** 更换数据线或 USB 端口

### "Device disconnected"
- **原因 / Cause:** 设备物理断开或驱动问题
- **解决 / Solution:** 检查连接和驱动

### "Not recognized as ADB device"
- **原因 / Cause:** 设备未开启 USB 调试或驱动问题
- **解决 / Solution:** 开启 USB 调试，安装驱动

### "Failed to start scrcpy server"
- **原因 / Cause:** 手机权限不足或存储空间不足
- **解决 / Solution:** 检查权限和存储空间

---

## 仍然无法解决？/ Still Can't Resolve?

### 收集信息 / Collect Information

在报告问题前，请收集以下信息：
Before reporting issues, collect this information:

1. **浏览器信息 / Browser Info**
   - Chrome 版本 / Chrome version
   - 操作系统 / Operating system

2. **设备信息 / Device Info**
   - 手机型号 / Phone model
   - Android 版本 / Android version

3. **错误信息 / Error Messages**
   - 完整的错误消息 / Complete error message
   - 控制台日志 / Console logs

4. **重现步骤 / Reproduction Steps**
   - 详细的操作步骤 / Detailed operation steps
   - 何时出现问题 / When the issue occurs

### 获取帮助 / Get Help

- GitHub Issues: [项目地址]
- 社区论坛 / Community Forum
- 开发者邮箱 / Developer Email

---

## 预防措施 / Prevention Measures

### 最佳实践 / Best Practices

1. **使用优质数据线 / Use Quality Cables**
   - 原装或认证数据线
   - Original or certified cables

2. **保持系统更新 / Keep System Updated**
   - 更新 Chrome 浏览器
   - Update Chrome browser
   - 更新手机系统
   - Update phone system

3. **定期清理 / Regular Cleanup**
   - 清理浏览器缓存
   - Clear browser cache
   - 清理手机存储
   - Clear phone storage

4. **避免冲突 / Avoid Conflicts**
   - 不同时运行多个 ADB 工具
   - Don't run multiple ADB tools simultaneously
   - 关闭不必要的后台程序
   - Close unnecessary background programs
