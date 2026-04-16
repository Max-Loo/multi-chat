## Context

测试基础设施已完成 i18n mock 统一和组件测试的 `renderWithProviders` 迁移。剩余 8 个问题分布在三类：hook 测试缺少共享 wrapper、两个文件手动构建 Redux store 状态绕过已有工厂、以及多个文件的测试质量和 mock 复用问题。

当前状态：
- 7 个 hook 测试各自定义 `createWrapper`（仅包裹 `<Provider>`），因为 `renderWithProviders` 基于 `render()` 不兼容 `renderHook`
- RunningChatBubble.test.tsx 有 13 处 `configureStore` 调用，手动构建 `runningChat` 三层嵌套结构
- panelLayout.tsx 内联了与 `createChatSliceState`/`createModelSliceState` 完全一致的默认值
- ChatContent.test.tsx 有 13 个仅断言 `container.firstChild` 的占位测试

## Goals / Non-Goals

**Goals:**
- 消除 hook 测试中 `createWrapper` 的 7 处重复定义
- 将 RunningChatBubble 和 panelLayout 的手动状态构建迁移到已有工厂函数
- 清理 ChatContent 假阳性测试
- 提取 BottomNav mock 和自定义工厂函数为共享模块
- 修复 ChatPanel 中的字符串字面量 action dispatch
- 清理 Sidebar.test.tsx 冗余注释

**Non-Goals:**
- 不引入新的测试框架或工具库
- 不修改生产代码
- 不改变测试运行方式或 CI 配置
- 不重构测试文件结构（仅修改文件内容）

## Decisions

### 1. 新增 `renderHookWithProviders` 而非扩展 `renderWithProviders`

**选择**：在 `helpers/render/redux.tsx` 中新增 `renderHookWithProviders` 函数

**理由**：`renderWithProviders` 基于 `@testing-library/react` 的 `render()`，而 hook 测试使用 `renderHook()`。两者的 wrapper 接口相同但返回值类型不同。新增独立函数比在 `renderWithProviders` 中增加条件分支更清晰，且与现有命名风格一致。

**替代方案**：
- 扩展 `renderWithProviders` 支持两种模式 — 增加复杂度，违反单一职责
- 仅提取 `createHookWrapper` — 减少重复但不如 `renderHookWithProviders` 一站式

### 2. 新增 `createRunningChatEntry` 辅助函数

**选择**：在 `testState.ts` 中新增 `createRunningChatEntry(chatId, modelId, overrides)` 辅助函数

**理由**：RunningChatBubble 的 13 处 `configureStore` 调用都构建相同的 `runningChat: { [chatId]: { [modelId]: { isSending, history } } }` 三层嵌套结构。提取为工厂函数后，可配合 `createChatSliceState` 和 `createTypeSafeTestStore` 使用。

### 3. panelLayout 使用 `createTypeSafeTestStore` + `reducerOverrides`

**选择**：`createPanelLayoutStore` 内部改用 `createTypeSafeTestStore`，通过 `reducerOverrides` 确保仅使用 chat 和 models 两个 reducer

**理由**：`createTypeSafeTestStore` 已支持 `reducerOverrides` 参数，可以直接复用。同时替换内联默认值为 `createChatSliceState`/`createModelSliceState`。这样 panelLayout 不再维护独立的默认值定义。

**替代方案**：
- 仅替换默认值但保留自己的 `configureStore` — 减少重复但仍有冗余

### 4. ChatContent 测试精简为 3 个有意义的测试

**选择**：将 14 个测试合并为 3 个：空状态占位文本、有聊天内容时正常渲染、无模型配置时的渲染

**理由**：原测试的文件注释已承认"流式消息的实际逻辑在 ChatPanel 组件中"。保留覆盖组件分支逻辑的最小测试集，删除声称测试实际由子组件实现的行为的占位测试。

### 5. BottomNav mock 提取到 `helpers/mocks/navigation.ts`

**选择**：创建 `helpers/mocks/navigation.ts` 导出 `createNavigationItemsMock()`

**理由**：两个文件中的 35 行 mock 代码完全相同，提取后各自只需一行调用。

## Risks / Trade-offs

- **RunningChatBubble 重构范围大**：13 处 configureStore 调用需要逐一替换 → 每处替换后立即运行该测试验证
- **panelLayout 公共 API 变化**：`createPanelLayoutStore` 的返回值类型可能因使用 `createTypeSafeTestStore` 而变化 → 检查所有调用方是否兼容
- **ChatContent 测试删除**：删除占位测试可能降低文件覆盖率数字 → 覆盖率数字提升但不代表实际测试质量提升，这是期望的行为
