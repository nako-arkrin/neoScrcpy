# PiP 按钮修复说明 / PiP Button Fix

## 问题 / Issue

PiP 按钮无法使用，显示为灰色禁用状态。

The PiP button is not working and appears grayed out (disabled).

---

## 修复内容 / Fixes Applied

### 1. ✅ 添加 `disabled` 和 `style` 属性支持

**文件 / File:** `src/ui/m3.tsx`

**修改前 / Before:**
```typescript
export const IconButton = ({
  onClick,
  title,
  children
}: React.PropsWithChildren<{ onClick?: () => void; title?: string }>) => (
  <button className="iconBtn" onClick={onClick} title={title} type="button">
    {children}
  </button>
);
```

**修改后 / After:**
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

---

### 2. ✅ 添加禁用状态样式

**文件 / File:** `src/styles/base.css`

**新增样式 / Added Styles:**
```css
.iconBtn {
  /* ... 原有样式 ... */
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

**效果 / Effects:**
- 禁用时：透明度 38%，鼠标显示禁止图标
- 启用时：正常透明度，鼠标显示指针
- 悬停时：背景色变化（仅启用时）
- 点击时：背景色加深（仅启用时）

---

## 使用说明 / Usage

### 按钮状态 / Button States

#### 1. 禁用状态（灰色）/ Disabled (Gray)
**条件 / Condition:** 设备未连接或镜像未启动

**外观 / Appearance:**
- 透明度：38%
- 鼠标：禁止图标 🚫
- 无法点击

**如何启用 / How to Enable:**
1. 连接 Android 设备
2. 授权 USB 调试
3. 等待镜像启动完成

---

#### 2. 正常状态（可用）/ Normal (Available)
**条件 / Condition:** 设备已连接且镜像正在运行

**外观 / Appearance:**
- 透明度：100%
- 颜色：灰色（未激活）
- 鼠标：指针 👆
- 可以点击

**操作 / Action:**
点击打开 PiP 窗口

---

#### 3. 激活状态（高亮）/ Active (Highlighted)
**条件 / Condition:** PiP 已打开

**外观 / Appearance:**
- 透明度：100%
- 颜色：主题色（紫色/蓝色）
- 鼠标：指针 👆
- 可以点击

**操作 / Action:**
点击关闭 PiP 窗口

---

## 重建扩展 / Rebuild Extension

修复后需要重建扩展：

```bash
cd chrome-extension
npm run build
```

然后重新加载扩展：
1. 打开 `chrome://extensions/`
2. 找到 neoScrcpy 扩展
3. 点击刷新图标 🔄

---

## 验证修复 / Verify Fix

### 1. 检查按钮属性 / Check Button Properties

在浏览器控制台运行：
```javascript
const pipBtn = Array.from(document.querySelectorAll('.iconBtn'))
  .find(btn => btn.title.includes('画中画') || btn.title.includes('PiP'));

console.log('Button found:', !!pipBtn);
console.log('Has disabled attribute:', 'disabled' in pipBtn);
console.log('Has style attribute:', 'style' in pipBtn);
console.log('Current disabled state:', pipBtn?.disabled);
```

**预期输出 / Expected:**
```
Button found: true
Has disabled attribute: true
Has style attribute: true
Current disabled state: true (未连接) / false (已连接)
```

---

### 2. 检查 CSS 样式 / Check CSS Styles

在浏览器控制台运行：
```javascript
const pipBtn = Array.from(document.querySelectorAll('.iconBtn'))
  .find(btn => btn.title.includes('画中画'));

const styles = window.getComputedStyle(pipBtn);
console.log('Opacity:', styles.opacity);
console.log('Cursor:', styles.cursor);
```

**预期输出（禁用时）/ Expected (Disabled):**
```
Opacity: 0.38
Cursor: not-allowed
```

**预期输出（启用时）/ Expected (Enabled):**
```
Opacity: 1
Cursor: pointer
```

---

### 3. 测试按钮功能 / Test Button Functionality

**步骤 / Steps:**

1. **未连接设备时 / When Device Not Connected:**
   - ✅ 按钮应该是灰色的
   - ✅ 鼠标悬停显示禁止图标
   - ✅ 点击无反应

2. **连接设备后 / After Connecting Device:**
   - ✅ 按钮变为正常颜色
   - ✅ 鼠标悬停显示指针
   - ✅ 悬停时背景色变化
   - ✅ 点击可以打开 PiP

3. **PiP 打开后 / After PiP Opens:**
   - ✅ 按钮变为主题色（高亮）
   - ✅ 再次点击可以关闭 PiP

---

## 故障排除 / Troubleshooting

### 问题 1: 按钮仍然无法点击

**检查 / Check:**
```javascript
const pipBtn = Array.from(document.querySelectorAll('.iconBtn'))
  .find(btn => btn.title.includes('画中画'));
console.log('Disabled:', pipBtn?.disabled);
console.log('Has onClick:', pipBtn?.onclick !== null);
```

**可能原因 / Possible Causes:**
1. 设备未连接 → 连接设备
2. 镜像未启动 → 等待启动完成
3. 扩展未重建 → 运行 `npm run build`
4. 扩展未重新加载 → 在 chrome://extensions/ 刷新

---

### 问题 2: 样式没有生效

**检查 / Check:**
```javascript
const pipBtn = Array.from(document.querySelectorAll('.iconBtn'))
  .find(btn => btn.title.includes('画中画'));
const styles = window.getComputedStyle(pipBtn);
console.log('Opacity:', styles.opacity);
```

**解决方法 / Solution:**
1. 清除浏览器缓存
2. 硬刷新页面（Ctrl + Shift + R）
3. 重建扩展
4. 重新加载扩展

---

### 问题 3: 按钮找不到

**检查 / Check:**
```javascript
const allButtons = document.querySelectorAll('.iconBtn');
console.log('Total icon buttons:', allButtons.length);
allButtons.forEach((btn, i) => {
  console.log(`Button ${i}:`, btn.title);
});
```

**可能原因 / Possible Causes:**
1. 页面未完全加载
2. 侧边栏未打开
3. 扩展安装有问题

---

## 相关文档 / Related Documentation

- [PiP 功能说明](./PIP_FEATURE.md)
- [PiP 调试指南](./PIP_DEBUG_GUIDE.md)
- [PiP 测试指南](./PIP_TEST_GUIDE.md)
- [快速开始](./QUICK_START.md)

---

## 技术细节 / Technical Details

### 为什么需要 `disabled` 属性？

PiP 功能依赖于：
1. 设备连接（`scrcpy.isConnected`）
2. Canvas 元素存在
3. 视频流可用

在设备未连接时，这些条件不满足，因此需要禁用按钮防止用户点击。

### 为什么需要 `style` 属性？

用于在 PiP 激活时高亮显示按钮，提供视觉反馈：
```typescript
style={pipMode !== "none" ? { color: "var(--color-primary)" } : undefined}
```

### CSS 过渡效果

添加了平滑的过渡动画：
```css
transition: background 150ms ease, opacity 150ms ease;
```

这使得状态变化更加流畅自然。

---

**最后更新 / Last Updated:** 2026-03-06

**状态 / Status:** ✅ 已修复 / Fixed
