## Purpose

P1 级 Hook（useCreateChat、useDebounce、useScrollContainer）的变异测试覆盖要求，确保通过 Stryker 变异测试验证测试套件对代码变异的检测能力。

## ADDED Requirements

### Requirement: useCreateChat 变异测试覆盖

`useCreateChat.ts` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **dispatch 顺序**: `createChat` → `setSelectedChatId` → `navigateToChat` 的执行顺序 SHALL 被严格验证，交换任何两步都 SHALL 被检测为失败
2. **generateId 调用**: 创建的聊天 ID SHALL 与 `generateId()` 返回值一致
3. **useCallback 引用稳定性**: `createNewChat` 函数引用在依赖不变时 SHALL 保持稳定

#### Scenario: dispatch 顺序严格保证
- **WHEN** 调用 `createNewChat`
- **THEN** `createChat` SHALL 在 `setSelectedChatId` 之前被 dispatch，`setSelectedChatId` SHALL 在 `navigateToChat` 之前被调用

#### Scenario: 连续创建多个聊天
- **WHEN** 快速连续调用 `createNewChat` 3 次
- **THEN** `selectedChatId` SHALL 为最后一次调用生成的 ID

#### Scenario: createNewChat 引用稳定
- **WHEN** 组件重新渲染但依赖未变化
- **THEN** `createNewChat` 函数引用 SHALL 与上次相同

### Requirement: useDebounce 变异测试覆盖

`useDebounce.ts` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **延迟更新**: 值变更后 SHALL 在 `delay` 毫秒后才更新返回值
2. **多次更新取最后一次**: 延迟期间多次更新 SHALL 只返回最后一次的值
3. **定时器清理**: value 或 delay 变化时 SHALL 清除旧定时器并创建新定时器
4. **初始值**: 首次渲染 SHALL 立即返回初始值

#### Scenario: 延迟期间多次更新取最后一次
- **WHEN** 在 300ms delay 内依次设置值为 "a"、"b"、"c"
- **THEN** 300ms 后返回值 SHALL 为 "c"，"a" 和 "b" SHALL 不出现

#### Scenario: delay 参数变化时定时器重置
- **WHEN** delay 从 300ms 变为 500ms，且在变化前已设置新值
- **THEN** SHALL 在 500ms 后（而非 300ms）才更新值

#### Scenario: value 变化时旧定时器被清除
- **WHEN** 值在旧定时器到期前再次变化
- **THEN** 旧定时器 SHALL 被清除，不会触发旧值的更新

### Requirement: useScrollContainer 变异测试覆盖

`useScrollContainer.ts` 的变异测试 SHALL 覆盖以下关键逻辑路径：

1. **ref 绑定**: `scrollContainerRef` SHALL 被正确创建并可绑定到 DOM 元素
2. **事件监听器添加**: 挂载后 SHALL 在 ref 元素上添加 scroll 事件监听器（passive: true）
3. **事件监听器移除**: 卸载后 SHALL 从 ref 元素移除 scroll 事件监听器
4. **scrollbarClassname 传递**: SHALL 将 `useAdaptiveScrollbar` 返回的类名透传出去

#### Scenario: 挂载时绑定 passive scroll 监听器
- **WHEN** 组件挂载并绑定 ref 到 DOM 元素
- **THEN** SHALL 在该元素上添加 scroll 事件监听器，且 `passive` 选项 SHALL 为 true

#### Scenario: 卸载时移除监听器
- **WHEN** 使用 `useScrollContainer` 的组件卸载
- **THEN** SHALL 调用 `removeEventListener` 移除 scroll 监听器

#### Scenario: 滚动触发类名切换
- **WHEN** 触发 scroll 事件
- **THEN** `scrollbarClassname` SHALL 从 `scrollbar-none` 变为 `scrollbar-thin`

### Requirement: 变异得分目标

补充测试后，`pnpm test:mutation` 运行结果中每个 Hook 的变异得分 SHALL 达到 **80% 或以上**。
