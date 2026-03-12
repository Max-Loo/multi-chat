## ADDED Requirements

### Requirement: 文本框高度自动调整

系统 SHALL 根据文本内容自动调整 textarea 的高度，在最小高度和最大高度之间动态变化。

#### Scenario: 单行输入
- **WHEN** 用户输入单行文本或文本框为空
- **THEN** 文本框高度保持最小高度 60px

#### Scenario: 多行输入增长
- **WHEN** 用户输入多行文本，内容高度增加
- **THEN** 文本框高度随内容自动增长，直到达到最大高度 192px

#### Scenario: 删除内容高度减小
- **WHEN** 用户删除文本内容，内容高度减少
- **THEN** 文本框高度随内容自动减小，但不低于最小高度 60px

#### Scenario: 达到最大高度显示滚动条
- **WHEN** 文本内容超过 8 行（约 192px）
- **THEN** 文本框高度保持最大高度 192px，并显示垂直滚动条

#### Scenario: 内容低于最大高度隐藏滚动条
- **WHEN** 文本内容减少至 8 行以内
- **THEN** 垂直滚动条自动隐藏

### Requirement: Hook 接口规范

`useAutoResizeTextarea` hook SHALL 提供以下接口：

```typescript
interface UseAutoResizeTextareaOptions {
  maxHeight?: number;  // 默认 192
  minHeight?: number;  // 默认 60
}

interface UseAutoResizeTextareaReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isScrollable: boolean;
}

function useAutoResizeTextarea(
  value: string,
  options?: UseAutoResizeTextareaOptions
): UseAutoResizeTextareaReturn;
```

#### Scenario: 基本使用
- **WHEN** 组件调用 `useAutoResizeTextarea(text, { maxHeight: 192, minHeight: 60 })`
- **THEN** 返回 `textareaRef` 用于绑定 textarea 元素，返回 `isScrollable` 表示是否需要滚动

#### Scenario: 默认参数
- **WHEN** 组件调用 `useAutoResizeTextarea(text)` 不传入 options
- **THEN** 使用默认值 maxHeight=192, minHeight=60

### Requirement: 响应值变化

Hook SHALL 在绑定的 value 值变化时重新计算高度。

#### Scenario: 值变化触发重算
- **WHEN** textarea 的 value 发生变化（用户输入或程序修改）
- **THEN** 自动重新计算并调整高度

#### Scenario: 初始值处理
- **WHEN** textarea 有初始值（如编辑场景）
- **THEN** 组件挂载后立即计算正确的高度

### Requirement: 跨浏览器兼容性

Hook SHALL 在所有支持的浏览器中正常工作，包括：
- Chrome/Edge (Chromium)
- Firefox
- Safari (包括 macOS 和 iOS)
- Tauri WebView (WebKit)

#### Scenario: Safari 兼容
- **WHEN** 在 Safari 浏览器中使用
- **THEN** 自动高度功能正常工作（不依赖 CSS field-sizing）

#### Scenario: Tauri macOS 兼容
- **WHEN** 在 Tauri macOS 应用中使用
- **THEN** 自动高度功能正常工作

### Requirement: 边界情况处理

Hook SHALL 安全处理边界情况，不抛出错误。

#### Scenario: textareaRef 为 null
- **WHEN** textareaRef.current 为 null（组件未挂载或已卸载）
- **THEN** hook 不执行高度计算，不抛出错误

#### Scenario: textarea 快速挂载卸载
- **WHEN** 组件在短时间内多次挂载和卸载
- **THEN** hook 正确清理，不产生内存泄漏或错误
