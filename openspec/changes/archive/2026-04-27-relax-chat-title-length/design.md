## Context

当前自动命名功能将标题硬截断为 10 个字符（`truncateTitle` 默认参数），prompt 中要求 5-10 个汉字。侧边栏 `ChatButton` 中标题显示无任何 CSS 溢出处理。手动命名无长度限制。

**现有代码结构**：
- `src/services/chat/titleGenerator.ts` — prompt 构建、`removePunctuation`、`truncateTitle`、`generateChatTitleService`
- `src/store/slices/chatSlices.ts` — `editChatName` reducer，仅校验空标题
- `src/pages/Chat/components/Sidebar/components/ChatButton.tsx` — 标题 `<span>` 无截断类

## Goals / Non-Goals

**Goals:**
- 自动命名允许 5-20 个字符，提供更充裕的标题空间
- 手动命名增加 20 字符上限（无下限），与自动命名保持一致的长度约束
- 侧边栏标题显示增加 CSS `text-overflow: ellipsis`，溢出时用 `…` 省略

**Non-Goals:**
- 不修改 Header 面板标题（空间充足，溢出风险低）
- 不添加 Tooltip 悬停显示完整标题（本次保持简单）
- 不修改 prompt 的长度约束提示策略

## Decisions

### 1. 生成层：调整 prompt 和截断参数

将 `buildTitlePrompt` 中 "5-10 个汉字" 改为 "5-20 个字符"，`truncateTitle` 默认 `maxLength` 从 10 改为 20。

**备选方案**：完全去掉 prompt 长度约束，纯靠 CSS 截断。但这样模型可能生成过长的标题，tooltip 场景下体验不好，所以保留 prompt 引导 + 代码兜底的双保险。

### 2. 手动命名：在 `editChatName` reducer 中增加长度校验

在现有的空标题校验之后，增加 `name.length > 20` 时截断到 20 个字符的逻辑。这样在 UI 和 Redux 两层都有保障。

**备选方案**：仅在 UI 的 Input 上通过 `maxLength` 属性限制。但 Redux 层防御更可靠（防止通过代码直接 dispatch），因此两层都做。

### 3. 显示层：ChatButton 标题增加 CSS 截断

在标题 `<span>` 上添加 `truncate` 类（Tailwind 的 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`），并在其 flex 父容器上添加 `min-w-0` 确保 flex 子元素正确截断。

项目中已有正确范例：`Panel/Detail/Title.tsx` 使用了 `truncate` + `min-w-0`。

## Risks / Trade-offs

- **[模型不遵守 prompt 长度]** → `truncateTitle(max=20)` 作为兜底截断
- **[手动命名用户输入超长被截断]** → 在 UI 层 Input 上也加 `maxLength={20}` 给用户即时反馈，Redux 层做静默截断防御
- **[侧边栏标题被省略号截断]** → 20 字符在侧边栏（192-224px）中大部分场景能完整显示，极端情况（全英文长词）才触发省略号
