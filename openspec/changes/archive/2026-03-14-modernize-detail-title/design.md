## Context

DetailTitle 组件位于聊天面板顶部，用于显示当前聊天所使用的模型信息。当前实现采用简单的文本拼接方式，缺乏视觉层次和交互性。

**约束条件**：
- 必须兼容现有 shadcn/ui 组件体系（new-york 风格）
- 必须复用已有的 `ProviderLogo` 组件
- 必须遵循 Web Interface Guidelines（可访问性、触屏支持）

**相关组件**：
- `ProviderLogo`: 已有，支持 Logo 加载、降级显示
- `Badge`: 已有，用于状态显示
- `Tooltip`: 需新增，通过 shadcn CLI 安装

## Goals / Non-Goals

**Goals:**
- 提升标题区域的视觉层次感
- 提供 Tooltip 交互查看完整模型信息
- 正确处理长文本溢出
- 支持键盘和触屏访问

**Non-Goals:**
- 不改变标题的点击行为（保持纯展示）
- 不修改 ProviderLogo 组件内部实现
- 不添加模型切换功能

## Decisions

### 1. 布局结构

**决定**: 采用 `Logo + 昵称 + [状态Badge]` 的紧凑单行布局

**备选方案**:
- ❌ 多行布局：占用过多垂直空间
- ❌ 卡片式设计：视觉过重，与现有风格不协调
- ✅ 紧凑单行：信息密度适中，符合方案 B 设计

### 2. Tooltip 触发方式

**决定**: 使用 shadcn Tooltip 默认配置（hover + focus + touch）

**理由**:
- shadcn Tooltip 基于 @radix-ui/react-tooltip，默认支持：
  - 鼠标 hover 触发
  - 键盘 Tab 聚焦触发
  - 触屏 long-press 触发
- 无需额外配置即可满足可访问性要求

### 3. 文本溢出处理

**决定**: 使用 `truncate` + `min-w-0` 组合

**理由**:
- Flex 子元素默认 `min-width: auto`，会阻止文本截断
- `min-w-0` 允许 flex 子元素收缩到内容以下
- `truncate` 提供 `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap`

### 4. 状态 Badge 显示逻辑

**决定**: 仅在异常状态（禁用/删除）时显示 Badge

**理由**:
- 正常状态不需要额外标识
- 异常状态需要醒目提示用户
- 减少视觉噪音

### 5. 国际化（i18n）处理

**决定**: 所有用户可见文本必须通过 i18next 翻译

**需要翻译的内容**:
- Tooltip 标签：`供应商`、`模型`、`昵称`
- Badge 文本：`已禁用`、`已删除`、`模型已删除`

**实现方式**:
- 使用项目现有的 `useTranslation()` hook
- 翻译键遵循现有命名规范（如 `chat.disabled`、`chat.deleted`）

### 6. 空值处理

**决定**: 昵称为空时显示模型名称作为备用

**理由**:
- `nickname` 是用户自定义的，可能为空字符串
- `modelName` 是必填项，始终存在
- 避免显示空白区域

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Tooltip 在窄屏幕上可能被截断 | 使用 `side="bottom"` 确保向下展开 |
| 长昵称截断后用户看不到完整内容 | Tooltip 中显示完整昵称 |
| Logo 加载失败 | ProviderLogo 已有首字母降级方案 |
| 暗色模式下 Badge 颜色对比度不足 | 使用 `bg-orange-500 text-white`，已验证对比度 |
