# Toast 提示组件使用文档

## 概述

Toast 是一个全局可复用的提示组件，用于显示成功、错误、警告和信息提示。

## 特点

- ✨ **美观的动画效果** - 从右侧滑入，流畅自然
- 🎨 **四种提示类型** - 成功、错误、警告、信息
- 🌓 **支持暗色主题** - 自动适配项目的暗色模式
- 📱 **响应式设计** - 在移动设备上也能完美显示
- ⏱️ **自动关闭** - 可自定义显示时长
- 🎯 **全局访问** - 在任何组件中都可以使用

## 使用方法

### 1. 基础用法

```jsx
import { useToast } from "@/src/components/Toast";

function MyComponent() {
  const toast = useToast();

  const handleClick = () => {
    toast.success("操作成功！");
    // 或
    toast.error("操作失败！");
    // 或
    toast.warning("请注意！");
    // 或
    toast.info("提示信息");
  };

  return <button onClick={handleClick}>显示提示</button>;
}
```

### 2. 自定义显示时长

默认显示 3000ms（3秒），可以自定义：

```jsx
toast.success("保存成功！", 5000); // 显示 5 秒
toast.error("网络错误", 10000); // 显示 10 秒
toast.info("提示", 0); // 不自动关闭，需手动关闭
```

### 3. 高级用法

```jsx
import { useToast } from "@/src/components/Toast";

function MyComponent() {
  const toast = useToast();

  const submitForm = async () => {
    try {
      await api.submit();
      toast.success("提交成功！");
    } catch (error) {
      toast.error(error.message || "提交失败，请重试。");
    }
  };

  return <button onClick={submitForm}>提交</button>;
}
```

## API

### useToast()

返回一个包含以下方法的对象：

| 方法 | 参数 | 说明 |
|------|------|------|
| `success` | `(message: string, duration?: number)` | 显示成功提示（绿色） |
| `error` | `(message: string, duration?: number)` | 显示错误提示（红色） |
| `warning` | `(message: string, duration?: number)` | 显示警告提示（橙色） |
| `info` | `(message: string, duration?: number)` | 显示信息提示（蓝色） |
| `addToast` | `(message, type, duration?)` | 添加自定义提示 |
| `removeToast` | `(id: number)` | 手动移除指定提示 |

## 样式定制

Toast 组件的样式在 `app/globals.css` 中，你可以根据需要修改：

```css
/* 修改容器位置 */
.toast-container {
  top: 20px;
  right: 20px;
}

/* 修改动画 */
@keyframes toast-slide-in {
  /* 自定义动画 */
}

/* 修改颜色主题 */
.toast.toast-success { /* ... */ }
.toast.toast-error { /* ... */ }
/* 等等 */
```

## 注意事项

1. **确保 ToastProvider 在根组件中** - Toast 组件需要在应用的根组件中包裹 `ToastProvider`（已在 `app/layout.jsx` 中配置）

2. **仅在客户端组件中使用** - Toast 是客户端组件，需要在 `"use client"` 的组件中使用

3. **错误提示优先级** - 错误提示通常会设置更长的显示时长，确保用户能看到

## 示例

### 在表单提交中使用

```jsx
"use client";

import { useToast } from "@/src/components/Toast";

export default function ContactForm() {
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch("/api/contact", { method: "POST" });
      toast.success("消息发送成功！我们会尽快回复您。");
    } catch (error) {
      toast.error("发送失败，请检查网络后重试。");
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 在 API 调用中使用

```jsx
const loadData = async () => {
  const toast = useToast();

  try {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("加载失败");
    toast.success("数据加载完成");
  } catch (error) {
    toast.error(error.message);
  }
};
```

## 技术实现

- **Context API** - 使用 React Context 实现全局状态管理
- **React Hooks** - 使用 useState、useCallback、useRef 管理状态
- **CSS 动画** - 使用 CSS keyframes 实现滑入动画
- **backdrop-filter** - 使用毛玻璃效果增强视觉体验
