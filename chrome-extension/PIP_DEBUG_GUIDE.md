# PiP 按钮调试指南 / PiP Button Debug Guide

## 问题：PiP 按钮无法使用 / Issue: PiP Button Not Working

### 快速检查清单 / Quick Checklist

#### 1. 检查设备连接状态 / Check Device Connection Status

**问题 / Issue:**
PiP 按钮在设备未连接时会被禁用。

**检查方法 / How to Check:**
1. 打开浏览器开发者工具（F12）
2. 在控制台运行：
```javascript
// 检查连接状态
console.log("Connected:", document.querySelector('.iconBtn[title*="画中画"]')?.disabled);
```

**预期结果 / Expected:**
- 未连接：`true` (按钮禁用)
- 已连接：`false` (按钮可用)

**解决方法 / Solution:**
1. 确保 Android 设备已连接
2. 确保 USB 调试已授权
3. 等待镜像启动完成

---

#### 2. 检查按钮状态 / Check Button State

**在控制台运行 / Run in Console:**
```javascript
// 获取 PiP 按钮
const pipBtn = Array.from(document.querySelectorAll('.iconBtn'))
  .find(btn => btn.title.includes('画中画') || btn.title.includes('PiP'));

console.log('PiP Button:', pipBtn);
console.log('Disabled:', pipBtn?.disabled);
console.log('Style:', pipBtn?.style.cssText);
console.log('Title:', pipBtn?.title);
```

**预期输出 / Expected Output:**
```
PiP Button: <button class="iconBtn" ...>
Disabled: false (如果已连接)
Style: "" (或 "color: var(--color-primary);" 如果已激活)
Title: "画中画" 或 "画中画 (Document)" 或 "画中画 (Overlay)"
```

---

#### 3. 检查 scrcpy 连接状态 / Check Scrcpy Connection

**在控制台运行 / Run in Console:**
```javascript
// 这需要在 React DevTools 中查看
// 或者检查页面上的状态文本
const statusText = document.querySelector('.muted')?.textContent;
console.log('Status:', statusText);
```

**预期状态 / Expected Status:**
- ✅ "镜像已启动" / "Mirroring active" - 可以使用 PiP
- ❌ "未连接" / "Disconnected" - 按钮禁用
- ⏳ "正在连接..." / "Connecting..." - 等待连接

---

#### 4. 检查 Canvas 元素 / Check Canvas Element

**在控制台运行 / Run in Console:**
```javascript
const canvas = document.querySelector('canvas');
console.log('Canvas:', canvas);
console.log('Canvas size:', canvas?.width, 'x', canvas?.height);
console.log('captureStream support:', typeof canvas?.captureStream === 'function');
```

**预期输出 / Expected Output:**
```
Canvas: <canvas width="..." height="...">
Canvas size: 1080 x 2400 (或其他分辨率)
captureStream support: true
```

**如果 Canvas 不存在 / If Canvas Doesn't Exist:**
- 设备可能未连接
- 镜像可能未启动
- 检查连接状态

---

#### 5. 检查 Document PiP API 支持 / Check Document PiP API Support

**在控制台运行 / Run in Console:**
```javascript
console.log('Document PiP supported:', typeof documentPictureInPicture !== 'undefined');
console.log('Document PiP API:', documentPictureInPicture);
```

**预期输出 / Expected Output:**
```
Document PiP supported: true (Chrome 116+)
Document PiP API: DocumentPictureInPicture {...}
```

**如果不支持 / If Not Supported:**
- 更新 Chrome 到 116+ 版本
- 系统会自动降级到 Overlay PiP

---

### 常见问题排查 / Common Issues

#### 问题 1: 按钮一直是灰色的 / Button Always Grayed Out

**可能原因 / Possible Causes:**
1. 设备未连接
2. 镜像未启动
3. `scrcpy.isConnected` 状态未更新

**调试步骤 / Debug Steps:**

1. 检查连接状态：
```javascript
// 在 React DevTools 中查看 ControlScreen 组件的 props
// 或者检查页面元素
const canvas = document.querySelector('canvas');
console.log('Has canvas:', !!canvas);
console.log('Canvas visible:', canvas?.offsetWidth > 0);
```

2. 检查状态文本：
```javascript
const statusDiv = document.querySelector('.muted');
console.log('Status:', statusDiv?.textContent);
```

3. 强制刷新页面：
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

#### 问题 2: 点击按钮没有反应 / Button Click No Response

**可能原因 / Possible Causes:**
1. JavaScript 错误阻止了执行
2. 事件监听器未正确绑定
3. Canvas 元素不可用

**调试步骤 / Debug Steps:**

1. 检查控制台错误：
```
打开开发者工具 → Console 标签
查看是否有红色错误信息
```

2. 手动触发 PiP：
```javascript
// 获取按钮并手动点击
const pipBtn = Array.from(document.querySelectorAll('.iconBtn'))
  .find(btn => btn.title.includes('画中画'));
pipBtn?.click();

// 查看控制台输出
```

3. 检查事件监听器：
```javascript
const pipBtn = Array.from(document.querySelectorAll('.iconBtn'))
  .find(btn => btn.title.includes('画中画'));
console.log('Has onClick:', pipBtn?.onclick !== null);
```

---

#### 问题 3: PiP 窗口无法打开 / PiP Window Won't Open

**可能原因 / Possible Causes:**
1. Document PiP API 不支持
2. Canvas 捕获失败
3. 浏览器权限问题

**调试步骤 / Debug Steps:**

1. 检查浏览器版本：
```
chrome://version/
确保版本 >= 116
```

2. 测试 Canvas 捕获：
```javascript
const canvas = document.querySelector('canvas');
const stream = canvas?.captureStream?.(30);
console.log('Stream:', stream);
console.log('Tracks:', stream?.getTracks());
```

3. 查看详细错误：
```javascript
// 打开控制台，点击 PiP 按钮
// 查看以下日志：
// ✅ "Document PiP opened successfully"
// ⚠️ "Falling back to overlay PiP"
// ❌ "Failed to open Document PiP: [error]"
```

---

### 手动测试 PiP 功能 / Manual PiP Test

#### 测试 Document PiP

```javascript
// 1. 获取 canvas
const canvas = document.querySelector('canvas');
if (!canvas) {
  console.error('Canvas not found');
} else {
  console.log('✅ Canvas found');
}

// 2. 测试 captureStream
const stream = canvas.captureStream(30);
if (!stream) {
  console.error('captureStream failed');
} else {
  console.log('✅ Stream created:', stream.getTracks().length, 'tracks');
}

// 3. 测试 Document PiP API
if (typeof documentPictureInPicture === 'undefined') {
  console.error('Document PiP not supported');
} else {
  console.log('✅ Document PiP supported');
  
  // 4. 尝试打开 PiP 窗口
  documentPictureInPicture.requestWindow({ width: 360, height: 640 })
    .then(win => {
      console.log('✅ PiP window opened:', win);
      
      // 5. 创建视频元素
      const video = win.document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.style.width = '100%';
      video.style.height = '100%';
      win.document.body.appendChild(video);
      
      console.log('✅ Video added to PiP window');
    })
    .catch(err => {
      console.error('❌ Failed to open PiP:', err);
    });
}
```

---

### 重建扩展 / Rebuild Extension

如果以上方法都不行，尝试重建扩展：

```bash
cd chrome-extension
npm run build
```

然后在 Chrome 中重新加载扩展：
1. 打开 `chrome://extensions/`
2. 找到 neoScrcpy
3. 点击刷新图标 🔄

---

### 检查更新的代码 / Check Updated Code

确保以下文件已更新：

#### 1. `src/ui/m3.tsx`

```typescript
export const IconButton = ({
  onClick,
  title,
  disabled,
  style,
  children
}: React.PropsWithChildren<{ 
  onClick?: () => void; 
  title?: string; 
  disabled?: boolean;
  style?: React.CSSProperties;
}>) => (
  <button 
    className="iconBtn" 
    onClick={onClick} 
    title={title} 
    type="button"
    disabled={disabled}
    style={style}
  >
    {children}
  </button>
);
```

#### 2. `src/styles/base.css`

```css
.iconBtn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--color-on-surface-variant);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 150ms ease, opacity 150ms ease;
}

.iconBtn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-on-surface) 6%, transparent);
}

.iconBtn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.iconBtn:active:not(:disabled) {
  background: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
}
```

#### 3. `src/pages/sidepanel/sidepanel-app.tsx`

```typescript
<IconButton 
  onClick={() => void togglePip()} 
  title={pipTitle}
  disabled={!scrcpy.isConnected}
  style={pipMode !== "none" ? { color: "var(--color-primary)" } : undefined}
>
  <IconPip size={20} />
</IconButton>
```

---

### 获取帮助 / Get Help

如果问题仍然存在，请提供以下信息：

1. **浏览器信息 / Browser Info:**
   - 浏览器：Chrome / Edge / Opera
   - 版本：（在 chrome://version/ 查看）

2. **控制台日志 / Console Logs:**
   ```
   打开开发者工具 → Console
   复制所有相关的日志信息
   ```

3. **按钮状态 / Button State:**
   ```javascript
   const pipBtn = Array.from(document.querySelectorAll('.iconBtn'))
     .find(btn => btn.title.includes('画中画'));
   console.log({
     exists: !!pipBtn,
     disabled: pipBtn?.disabled,
     title: pipBtn?.title,
     style: pipBtn?.style.cssText
   });
   ```

4. **连接状态 / Connection Status:**
   ```javascript
   console.log({
     hasCanvas: !!document.querySelector('canvas'),
     statusText: document.querySelector('.muted')?.textContent,
     documentPipSupported: typeof documentPictureInPicture !== 'undefined'
   });
   ```

---

## 快速修复步骤 / Quick Fix Steps

1. ✅ 确保设备已连接并授权
2. ✅ 等待镜像启动完成（看到设备屏幕）
3. ✅ 检查按钮是否不再是灰色
4. ✅ 点击 PiP 按钮
5. ✅ 查看控制台日志
6. ✅ 如果失败，重建扩展并重新加载

---

**最后更新 / Last Updated:** 2026-03-06
