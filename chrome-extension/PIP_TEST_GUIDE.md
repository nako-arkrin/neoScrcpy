# PiP 功能测试指南 / PiP Feature Test Guide

## 测试前准备 / Pre-test Setup

### 环境要求 / Environment Requirements

- ✅ Chrome 116+ 或 Edge 116+
- ✅ 已安装并启用 neoScrcpy 扩展
- ✅ Android 设备已连接并授权 USB 调试
- ✅ 设备镜像已成功启动

---

- ✅ Chrome 116+ or Edge 116+
- ✅ neoScrcpy extension installed and enabled
- ✅ Android device connected with USB debugging authorized
- ✅ Device mirroring successfully started

## 测试清单 / Test Checklist

### 1. 基础功能测试 / Basic Functionality Tests

#### 1.1 Document PiP 打开测试 / Document PiP Open Test

**步骤 / Steps:**
1. 连接设备并启动镜像
2. 点击侧边栏顶部的 PiP 图标 (📺)
3. 观察是否打开独立的 PiP 窗口

**预期结果 / Expected:**
- ✅ 打开一个独立的浮动窗口
- ✅ 窗口显示设备屏幕内容
- ✅ 右上角显示 "● LIVE" 绿色指示器
- ✅ 底部显示设备名称和提示信息

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

#### 1.2 触摸控制测试 / Touch Control Test

**步骤 / Steps:**
1. 在 PiP 窗口中点击屏幕
2. 尝试拖动滑动
3. 测试多点触控（如果支持）

**预期结果 / Expected:**
- ✅ 点击响应正确
- ✅ 滑动流畅
- ✅ 坐标映射准确

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

#### 1.3 PiP 关闭测试 / PiP Close Test

**步骤 / Steps:**
1. 再次点击 PiP 图标
2. 观察窗口是否关闭

**预期结果 / Expected:**
- ✅ PiP 窗口关闭
- ✅ 资源正确清理
- ✅ 侧边栏镜像继续正常工作

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

### 2. 降级功能测试 / Fallback Functionality Tests

#### 2.1 Overlay PiP 测试 / Overlay PiP Test

**步骤 / Steps:**
1. 在不支持 Document PiP 的浏览器中测试
2. 或者模拟 Document PiP 失败
3. 点击 PiP 图标

**预期结果 / Expected:**
- ✅ 自动降级到 Overlay PiP
- ✅ 在侧边栏右下角显示小窗口
- ✅ 触摸控制正常工作

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

### 3. 错误处理测试 / Error Handling Tests

#### 3.1 未连接设备测试 / Device Not Connected Test

**步骤 / Steps:**
1. 在未连接设备时点击 PiP 图标
2. 观察按钮状态和行为

**预期结果 / Expected:**
- ✅ PiP 按钮显示为禁用状态
- ✅ 点击无响应
- ✅ 控制台显示警告信息

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

#### 3.2 视频流错误测试 / Video Stream Error Test

**步骤 / Steps:**
1. 打开 PiP
2. 断开设备连接
3. 观察 PiP 窗口状态

**预期结果 / Expected:**
- ✅ 状态指示器变为 "● ERROR"
- ✅ 控制台显示错误日志
- ✅ 资源正确清理

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

### 4. 性能测试 / Performance Tests

#### 4.1 长时间运行测试 / Long Running Test

**步骤 / Steps:**
1. 打开 PiP
2. 保持运行 30 分钟
3. 观察性能和稳定性

**预期结果 / Expected:**
- ✅ 视频流畅，无卡顿
- ✅ 内存使用稳定
- ✅ CPU 使用合理（< 30%）
- ✅ 无内存泄漏

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

#### 4.2 多次开关测试 / Multiple Open/Close Test

**步骤 / Steps:**
1. 连续打开和关闭 PiP 10 次
2. 观察每次的响应时间和稳定性

**预期结果 / Expected:**
- ✅ 每次都能正常打开/关闭
- ✅ 无内存泄漏
- ✅ 响应时间稳定

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

### 5. 兼容性测试 / Compatibility Tests

#### 5.1 浏览器兼容性 / Browser Compatibility

**测试浏览器 / Test Browsers:**

| 浏览器 / Browser | 版本 / Version | Document PiP | Overlay PiP | 备注 / Notes |
|-----------------|---------------|--------------|-------------|-------------|
| Chrome          | 116+          | [ ]          | [ ]         |             |
| Edge            | 116+          | [ ]          | [ ]         |             |
| Opera           | 102+          | [ ]          | [ ]         |             |
| Firefox         | Latest        | [ ]          | [ ]         |             |

---

#### 5.2 设备兼容性 / Device Compatibility

**测试设备 / Test Devices:**

| 设备 / Device | Android 版本 / Version | 分辨率 / Resolution | 结果 / Result | 备注 / Notes |
|--------------|----------------------|-------------------|--------------|-------------|
|              |                      |                   | [ ]          |             |
|              |                      |                   | [ ]          |             |
|              |                      |                   | [ ]          |             |

---

### 6. UI/UX 测试 / UI/UX Tests

#### 6.1 按钮状态测试 / Button State Test

**步骤 / Steps:**
1. 观察未连接时的按钮状态
2. 连接后观察按钮状态
3. 打开 PiP 后观察按钮状态

**预期结果 / Expected:**
- ✅ 未连接：按钮禁用，灰色
- ✅ 已连接：按钮可用，正常颜色
- ✅ PiP 激活：按钮高亮，主题色

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

#### 6.2 状态指示器测试 / Status Indicator Test

**步骤 / Steps:**
1. 打开 Document PiP
2. 观察状态指示器
3. 模拟错误情况

**预期结果 / Expected:**
- ✅ 正常：绿色 "● LIVE"
- ✅ 错误：灰色 "● ERROR"
- ✅ 位置：右上角
- ✅ 样式：圆角，半透明背景

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

### 7. 资源管理测试 / Resource Management Tests

#### 7.1 内存泄漏测试 / Memory Leak Test

**步骤 / Steps:**
1. 打开 Chrome 任务管理器
2. 记录初始内存使用
3. 打开/关闭 PiP 20 次
4. 记录最终内存使用

**预期结果 / Expected:**
- ✅ 内存增长 < 50MB
- ✅ 关闭后内存回收
- ✅ 无持续增长趋势

**测试数据 / Test Data:**
- 初始内存 / Initial: _____ MB
- 最终内存 / Final: _____ MB
- 增长量 / Growth: _____ MB

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

#### 7.2 视频流清理测试 / Video Stream Cleanup Test

**步骤 / Steps:**
1. 打开浏览器控制台
2. 打开 PiP
3. 关闭 PiP
4. 检查控制台日志

**预期结果 / Expected:**
- ✅ 看到 "Failed to stop track" 日志（如果有）
- ✅ 所有视频轨道已停止
- ✅ 事件监听器已移除

**实际结果 / Actual:**
- [ ] 通过 / Pass
- [ ] 失败 / Fail
- [ ] 备注 / Notes: _______________

---

## 调试技巧 / Debugging Tips

### 查看控制台日志 / View Console Logs

**Document PiP 相关日志 / Document PiP Logs:**
```
✅ "Document PiP opened successfully"
⚠️ "Document Picture-in-Picture API is not supported"
❌ "Failed to open Document PiP: [error]"
```

**Overlay PiP 相关日志 / Overlay PiP Logs:**
```
✅ "Falling back to overlay PiP"
✅ "Overlay PiP opened successfully"
❌ "Canvas captureStream not supported"
```

**错误日志 / Error Logs:**
```
❌ "Canvas captureStream is not supported"
❌ "Failed to capture canvas stream"
❌ "Failed to play PiP video: [error]"
❌ "PiP video error: [error]"
```

### 检查 API 支持 / Check API Support

在控制台运行 / Run in console:

```javascript
// 检查 Document PiP 支持
console.log("Document PiP:", typeof documentPictureInPicture !== "undefined");

// 检查 Canvas Capture 支持
console.log("Canvas Capture:", typeof HTMLCanvasElement.prototype.captureStream === "function");

// 检查当前 PiP 状态
console.log("PiP Window:", documentPictureInPicture?.window);
```

### 性能监控 / Performance Monitoring

```javascript
// 监控内存使用
console.memory.usedJSHeapSize / 1048576 + " MB"

// 监控帧率
// 在 PiP 窗口控制台运行
let lastTime = performance.now();
let frames = 0;
requestAnimationFrame(function measure() {
  frames++;
  const now = performance.now();
  if (now >= lastTime + 1000) {
    console.log("FPS:", frames);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(measure);
});
```

## 问题报告模板 / Issue Report Template

```markdown
### 问题描述 / Issue Description
[描述遇到的问题]

### 复现步骤 / Steps to Reproduce
1. 
2. 
3. 

### 预期行为 / Expected Behavior
[描述预期的行为]

### 实际行为 / Actual Behavior
[描述实际发生的情况]

### 环境信息 / Environment
- 浏览器 / Browser: 
- 版本 / Version: 
- 操作系统 / OS: 
- 设备型号 / Device: 
- Android 版本 / Android Version: 

### 控制台日志 / Console Logs
```
[粘贴相关的控制台日志]
```

### 截图 / Screenshots
[如果可能，附上截图]
```

## 测试总结 / Test Summary

**测试日期 / Test Date:** _______________

**测试人员 / Tester:** _______________

**总体评分 / Overall Rating:** _____ / 10

**通过的测试 / Passed Tests:** _____ / _____

**失败的测试 / Failed Tests:** _____ / _____

**主要问题 / Major Issues:**
1. 
2. 
3. 

**建议改进 / Suggested Improvements:**
1. 
2. 
3. 

**备注 / Additional Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
