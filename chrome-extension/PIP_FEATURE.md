# 画中画 (PiP) 功能说明 / Picture-in-Picture Feature

## 功能概述 / Overview

neoScrcpy 支持两种画中画模式，让你可以在浏览其他网页时继续查看和控制 Android 设备。

neoScrcpy supports two Picture-in-Picture modes, allowing you to view and control your Android device while browsing other pages.

## 两种 PiP 模式 / Two PiP Modes

### 1. 📺 Document PiP（推荐）/ Document PiP (Recommended)

**特点 / Features:**
- ✅ 独立的浮动窗口
- ✅ Independent floating window
- ✅ 完整的触摸控制支持
- ✅ Full touch control support
- ✅ 实时状态指示器（LIVE）
- ✅ Real-time status indicator (LIVE)
- ✅ 可调整窗口大小
- ✅ Resizable window
- ✅ 更好的性能
- ✅ Better performance

**要求 / Requirements:**
- Chrome 116+ 或支持 Document Picture-in-Picture API 的浏览器
- Chrome 116+ or browser with Document Picture-in-Picture API support

### 2. 📱 Overlay PiP（备用）/ Overlay PiP (Fallback)

**特点 / Features:**
- ✅ 固定在侧边栏右下角
- ✅ Fixed at bottom-right of sidebar
- ✅ 支持触摸控制
- ✅ Touch control support
- ✅ 自动降级方案
- ✅ Automatic fallback option
- ✅ 兼容性更好
- ✅ Better compatibility

**使用场景 / Use Cases:**
- 当 Document PiP 不可用时自动启用
- Automatically enabled when Document PiP is unavailable
- 适合需要在侧边栏内保持 PiP 的场景
- Suitable for keeping PiP within sidebar

## 使用方法 / How to Use

### 开启 PiP / Enable PiP

1. 连接 Android 设备并开始镜像
2. 点击侧边栏顶部的画中画图标 (📺)
3. 系统会自动选择最佳的 PiP 模式

---

1. Connect Android device and start mirroring
2. Click the PiP icon (📺) at the top of sidebar
3. System will automatically select the best PiP mode

### 控制设备 / Control Device

**在 Document PiP 窗口中 / In Document PiP Window:**
- 点击 = 触摸屏幕
- Click = Touch screen
- 拖动 = 滑动
- Drag = Swipe
- 右键点击 = 返回键（如果支持）
- Right-click = Back button (if supported)

**在 Overlay PiP 中 / In Overlay PiP:**
- 与 Document PiP 相同的控制方式
- Same controls as Document PiP

### 关闭 PiP / Close PiP

**方法 1 / Method 1:**
- 再次点击画中画图标
- Click the PiP icon again

**方法 2 / Method 2:**
- 关闭 Document PiP 窗口（仅限 Document PiP）
- Close the Document PiP window (Document PiP only)

## 技术实现 / Technical Implementation

### Document PiP API

```typescript
// 检查支持 / Check support
export function isDocumentPipSupported(): boolean {
  return typeof (window as any).documentPictureInPicture !== "undefined";
}

// 打开 PiP 窗口 / Open PiP window
const win = await documentPictureInPicture.requestWindow({ 
  width: 360, 
  height: 640,
  disallowReturnToOpener: false
});
```

### Canvas Stream Capture

```typescript
// 检查支持 / Check support
export function isCaptureStreamSupported(canvas: HTMLCanvasElement): boolean {
  return typeof canvas.captureStream === "function";
}

// 捕获画布流 / Capture canvas stream
const stream = canvas.captureStream(30); // 30 FPS
```

### 触摸事件映射 / Touch Event Mapping

```typescript
// 将窗口坐标映射到设备坐标
// Map window coordinates to device coordinates
const mapped = mapClientToVideo({ 
  clientX: event.clientX, 
  clientY: event.clientY, 
  target: videoElement 
});

// 注入触摸事件 / Inject touch event
await controller.injectTouch({
  action: AndroidMotionEventAction.Down,
  pointerId: BigInt(event.pointerId),
  pointerX: mapped.x,
  pointerY: mapped.y,
  videoWidth: mapped.vw,
  videoHeight: mapped.vh,
  pressure: event.pressure || 1
});
```

## 功能特性 / Features

### ✨ 智能模式选择 / Smart Mode Selection
- 自动检测浏览器支持
- Automatically detects browser support
- 优先使用 Document PiP
- Prefers Document PiP
- 自动降级到 Overlay PiP
- Auto-fallback to Overlay PiP

### 🎯 精确触摸控制 / Precise Touch Control
- 坐标精确映射
- Accurate coordinate mapping
- 支持多点触控
- Multi-touch support
- 压力感应支持
- Pressure sensitivity support

### 📊 实时状态显示 / Real-time Status
- LIVE 指示器（Document PiP）
- LIVE indicator (Document PiP)
- 错误状态提示
- Error status indication
- 连接状态监控
- Connection status monitoring

### 🔄 自动资源清理 / Automatic Resource Cleanup
- 窗口关闭时自动清理
- Auto cleanup on window close
- 停止视频流
- Stop video streams
- 移除事件监听器
- Remove event listeners

## 故障排除 / Troubleshooting

### PiP 按钮不可用 / PiP Button Disabled

**原因 / Reason:**
- 设备未连接
- Device not connected
- 镜像未启动
- Mirroring not started

**解决方法 / Solution:**
1. 确保设备已连接
2. 等待镜像启动完成
3. 检查连接状态

---

1. Ensure device is connected
2. Wait for mirroring to start
3. Check connection status

### Document PiP 无法打开 / Cannot Open Document PiP

**原因 / Reason:**
- 浏览器不支持 Document PiP API
- Browser doesn't support Document PiP API
- Chrome 版本过低（需要 116+）
- Chrome version too old (requires 116+)

**解决方法 / Solution:**
1. 更新 Chrome 到最新版本
2. 系统会自动使用 Overlay PiP 作为备用
3. 检查浏览器兼容性

---

1. Update Chrome to latest version
2. System will auto-use Overlay PiP as fallback
3. Check browser compatibility

### 视频流黑屏 / Video Stream Black Screen

**原因 / Reason:**
- Canvas 捕获失败
- Canvas capture failed
- 视频解码器问题
- Video decoder issue

**解决方法 / Solution:**
1. 关闭并重新打开 PiP
2. 重新连接设备
3. 检查浏览器控制台错误日志

---

1. Close and reopen PiP
2. Reconnect device
3. Check browser console for errors

### 触摸控制不响应 / Touch Control Not Responding

**原因 / Reason:**
- 控制器未初始化
- Controller not initialized
- 坐标映射错误
- Coordinate mapping error

**解决方法 / Solution:**
1. 确保设备连接正常
2. 检查 scrcpy 服务状态
3. 重新打开 PiP 窗口

---

1. Ensure device connection is stable
2. Check scrcpy service status
3. Reopen PiP window

## 浏览器兼容性 / Browser Compatibility

### Document PiP Support

| 浏览器 / Browser | 最低版本 / Min Version | 支持状态 / Support |
|-----------------|----------------------|-------------------|
| Chrome          | 116+                 | ✅ 完全支持 / Full |
| Edge            | 116+                 | ✅ 完全支持 / Full |
| Opera           | 102+                 | ✅ 完全支持 / Full |
| Firefox         | -                    | ❌ 不支持 / No    |
| Safari          | -                    | ❌ 不支持 / No    |

### Canvas Capture Stream Support

| 浏览器 / Browser | 最低版本 / Min Version | 支持状态 / Support |
|-----------------|----------------------|-------------------|
| Chrome          | 51+                  | ✅ 完全支持 / Full |
| Edge            | 79+                  | ✅ 完全支持 / Full |
| Firefox         | 43+                  | ✅ 完全支持 / Full |
| Safari          | 11+                  | ✅ 完全支持 / Full |
| Opera           | 38+                  | ✅ 完全支持 / Full |

## 性能优化 / Performance Optimization

### 帧率设置 / Frame Rate

```typescript
// 默认 30 FPS，平衡性能和流畅度
// Default 30 FPS, balances performance and smoothness
const stream = canvas.captureStream(30);
```

### 窗口大小 / Window Size

```typescript
// 默认 360x640，适合大多数手机屏幕比例
// Default 360x640, suitable for most phone aspect ratios
const win = await documentPictureInPicture.requestWindow({ 
  width: 360, 
  height: 640 
});
```

### 资源管理 / Resource Management

- 自动停止未使用的视频流
- Auto-stop unused video streams
- 及时清理事件监听器
- Timely cleanup of event listeners
- 窗口关闭时释放资源
- Release resources on window close

## 开发调试 / Development & Debugging

### 启用调试日志 / Enable Debug Logs

打开浏览器控制台查看详细日志：
Open browser console to view detailed logs:

```javascript
// PiP 功能相关日志 / PiP feature logs
"Document PiP opened successfully"
"Falling back to overlay PiP"
"Canvas captureStream is not supported"
"Failed to open Document PiP: [error]"
```

### 检查 API 支持 / Check API Support

```javascript
// 在控制台运行 / Run in console
console.log("Document PiP:", typeof documentPictureInPicture !== "undefined");
console.log("Canvas Capture:", typeof HTMLCanvasElement.prototype.captureStream === "function");
```

## 未来改进 / Future Improvements

- [ ] 支持键盘输入（Document PiP）
- [ ] Keyboard input support (Document PiP)
- [ ] 自定义窗口大小
- [ ] Custom window size
- [ ] 记住窗口位置
- [ ] Remember window position
- [ ] 多设备同时 PiP
- [ ] Multiple device PiP
- [ ] 录制 PiP 视频
- [ ] Record PiP video
- [ ] 截图功能
- [ ] Screenshot feature

## 相关文档 / Related Documentation

- [快速开始](./QUICK_START.md)
- [Bug 修复记录](./BUG_FIXES.md)
- [连接问题排查](./TROUBLESHOOTING.md)
- [Quick Start](./QUICK_START.md)
- [Bug Fix Log](./BUG_FIXES.md)
- [Connection Troubleshooting](./TROUBLESHOOTING.md)

## 参考资料 / References

- [Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture/)
- [HTMLCanvasElement.captureStream()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream)
- [Scrcpy Protocol](https://github.com/Genymobile/scrcpy)
