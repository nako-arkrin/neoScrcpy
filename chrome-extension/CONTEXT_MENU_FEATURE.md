# 右键菜单功能说明 / Context Menu Feature

## 功能概述 / Overview

现在可以通过右键菜单快速打开 neoScrcpy 侧边栏，无需点击扩展图标。

Now you can quickly open the neoScrcpy side panel through the context menu without clicking the extension icon.

## 使用方法 / How to Use

### 中文用户 / Chinese Users

1. 在任何网页上右键点击
2. 在菜单中找到"打开 neoScrcpy 侧边栏"
3. 点击后侧边栏将自动打开

### English Users

1. Right-click on any webpage
2. Find "Open neoScrcpy Side Panel" in the menu
3. The side panel will open automatically after clicking

## 功能特性 / Features

### ✨ 快速访问 / Quick Access
- 无需寻找扩展图标
- No need to find the extension icon
- 一键打开侧边栏
- One-click to open side panel

### 🌍 多语言支持 / Multi-language Support
- 自动根据设置中的语言显示
- Automatically displays based on language settings
- 支持中文和英文
- Supports Chinese and English

### 🔄 动态更新 / Dynamic Updates
- 切换语言后菜单文本自动更新
- Menu text updates automatically after language change
- 无需重启浏览器
- No browser restart required

## 技术实现 / Technical Implementation

### 权限要求 / Required Permissions

```json
{
  "permissions": [
    "storage",
    "sidePanel",
    "tabs",
    "windows",
    "contextMenus"  // 新增 / New
  ]
}
```

### 核心代码 / Core Code

**创建菜单 / Create Menu:**
```typescript
async function updateContextMenu() {
  await chrome.contextMenus.removeAll();
  const state = await getState();
  const title = state.locale === "zh-CN" 
    ? "打开 neoScrcpy 侧边栏" 
    : "Open neoScrcpy Side Panel";
  
  await chrome.contextMenus.create({
    id: "open-sidepanel",
    title,
    contexts: ["all"]
  });
}
```

**处理点击 / Handle Click:**
```typescript
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "open-sidepanel") {
    const windowId = tab?.windowId ?? (await chrome.windows.getCurrent()).id;
    if (typeof windowId === "number" && chrome.sidePanel?.open) {
      await chrome.sidePanel.open({ windowId });
    }
  }
});
```

**监听语言变化 / Listen to Language Changes:**
```typescript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.locale) {
    void updateContextMenu();
  }
});
```

## 测试清单 / Testing Checklist

- [ ] 在普通网页上右键，能看到菜单项
- [ ] 点击菜单项后侧边栏正确打开
- [ ] 切换到英文后，菜单显示英文文本
- [ ] 切换到中文后，菜单显示中文文本
- [ ] 在已打开侧边栏的情况下点击菜单，不会出错
- [ ] 在不同的浏览器窗口中测试

---

- [ ] Right-click on a normal webpage, menu item is visible
- [ ] Side panel opens correctly after clicking menu item
- [ ] Menu shows English text after switching to English
- [ ] Menu shows Chinese text after switching to Chinese
- [ ] No errors when clicking menu with side panel already open
- [ ] Test in different browser windows

## 常见问题 / FAQ

### Q: 为什么看不到右键菜单？
**A:** 请确保：
1. 扩展已正确安装并启用
2. 刷新页面后再试
3. 检查扩展权限是否完整

### Q: Why can't I see the context menu?
**A:** Please ensure:
1. Extension is properly installed and enabled
2. Refresh the page and try again
3. Check if extension permissions are complete

### Q: 菜单语言不对怎么办？
**A:** 
1. 打开侧边栏
2. 进入设置 → 通用设置
3. 切换语言
4. 右键菜单会自动更新

### Q: What if the menu language is wrong?
**A:**
1. Open the side panel
2. Go to Settings → General
3. Switch language
4. Context menu will update automatically

## 更新日志 / Changelog

### v0.1.1 (2026-03-06)
- ✨ 新增右键菜单功能
- ✨ Added context menu feature
- 🌍 支持中英文切换
- 🌍 Support Chinese/English switching
- 🔄 动态语言更新
- 🔄 Dynamic language updates
