# 任务清单：Redux Selector 订阅粒度优化

## 1. ChatButton Selector 优化

- [x] **Sidebar 新增 selectedChatId 订阅**
  文件：`src/pages/Chat/components/Sidebar/index.tsx`
  - 添加 `useAppSelector((state) => state.chat.selectedChatId)` 订阅
  - 渲染 `<ChatButton>` 时传入 `isSelected={chat.id === selectedChatId}`

- [x] **ChatButton 改用 isSelected props**
  文件：`src/pages/Chat/components/Sidebar/components/ChatButton.tsx`
  - `ChatButtonProps` 接口新增 `isSelected: boolean`
  - 移除 `useAppSelector((state) => state.chat.selectedChatId)` 及相关导入
  - 将三处 `chat.id === selectedChatId` 替换为 `isSelected`（第 78、126、166 行）
  - 更新 `memo` 比较函数，增加 `prevProps.isSelected === nextProps.isSelected`

- [x] **更新 ChatButton.test.tsx 适配 isSelected props**
  文件：`src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx`
  - `renderChatButton` 辅助函数新增 `isSelected` 参数，传递给 `<ChatButton isSelected={isSelected} />`
  - 更新所有测试用例：选中的测试传 `isSelected={true}`，未选中的传 `isSelected={false}`
  - "组件 memo 优化"测试中的 rerender 也需传入 `isSelected`
  - store 中的 `selectedChatId` 对 ChatButton 不再生效（仅通过 props 传入），但 store 仍需保留供其他组件使用

## 2. Detail RunningChat Selector 优化

- [x] **缩小 Detail 的 runningChat selector 路径**
  文件：`src/pages/Chat/components/Panel/Detail/index.tsx`
  - 将 `useAppSelector(state => state.chat.runningChat)` 改为精确路径：
    `useAppSelector(state => state.chat.runningChat[selectedChat?.id]?.[chatModel.modelId])`
  - 将变量名从 `runningChat` 改为 `runningChatData`

- [x] **更新 Detail 中 runningChat 的使用点**
  文件：`src/pages/Chat/components/Panel/Detail/index.tsx`
  - 第 121 行 `useEffect` 依赖：`runningChat` → `runningChatData`
  - 第 167 行 JSX：`runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage` → `runningChatData?.errorMessage`
  - 第 173 行 JSX：同上简化

## 3. useIsSending Selector 优化

- [x] **缩小 useIsSending 的 runningChat selector 路径**
  文件：`src/pages/Chat/hooks/useIsSending.ts`
  - 将 `useAppSelector(state => state.chat.runningChat)` 改为：
    `useAppSelector(state => state.chat.runningChat[selectedChat?.id])`
  - 将变量名从 `runningChat` 改为 `currentChatRunning`
  - 更新 `useMemo` 依赖：`runningChat` → `currentChatRunning`
  - 更新 `useMemo` 内部使用：`runningChat[selectedChat.id]` → `currentChatRunning`

## 4. Title Model Selector 优化

- [x] **合并 Title 的 selector 和 useMemo**
  文件：`src/pages/Chat/components/Panel/Detail/Title.tsx`
  - 移除 `const models = useAppSelector((state) => state.models.models)`
  - 移除 `const currentModel = useMemo(() => ..., [chatModel, models])`
  - 替换为单个 selector：`const currentModel = useAppSelector((state) => state.models.models.find((model) => model.id === chatModel.modelId))`
  - 清理不再需要的 `useMemo` 导入（如果该文件无其他使用）

## 5. 性能验证：ChatButton 渲染次数和耗时对比

> 详细方案见 `openspec/changes/optimize-redux-selector-granularity/specs/chat-button-perf-verification/spec.md`

- [x] **创建测试目录和文件**
  文件：`src/__test__/performance/chat-button-render-count.test.tsx`
  - 实现 `createRenderTracker`：统计每个 ChatButton 的渲染次数和时间戳
  - 实现 `createLegacyPattern`：N 个 wrapper 各自 `useAppSelector(selectedChatId)`，模拟优化前行为
  - 实现 `createOptimizedPattern`：父组件订阅一次，通过 `isSelected` props 下沉，验证优化后行为
  - 实现 `measureSelectionChange`：通过真实 `store.dispatch` 触发选中切换并测量耗时
  - 复用现有 `ChatButton.test.tsx` 的 mock 配置

- [x] **编写渲染次数对比用例**
  场景：20 个聊天，切换选中从 chat-0 到 chat-9
  - 断言优化前（Legacy）：所有 20 个 ChatButton 都重渲染（`getReRenderCount() === 20`）
  - 断言优化后（Optimized）：仅 2 个 ChatButton 重渲染（`getReRenderCount() === 2`）

- [x] **编写多数据规模对比用例**
  数据规模：10、20、50 个聊天
  - 每种规模下分别运行 Legacy 和 Optimized 模式
  - 断言：Legacy `getReRenderCount() === count`，Optimized `getReRenderCount() === 2`

- [x] **编写连续切换稳定性用例**
  场景：20 个聊天，连续切换 3 次（0→5→15→0）
  - 断言：每次切换仅影响 2 个 ChatButton，其余保持不变

- [x] **编写渲染耗时对比用例**
  场景：50 个聊天，多次运行取平均
  - 记录优化前后的平均渲染耗时（`console.log` 输出供人工审查）
  - 断言：优化后耗时 ≤ 优化前 × 1.5（容许测试环境波动）

- [x] **运行性能验证测试确认通过**
  - 执行 `pnpm vitest run src/__test__/performance/ --reporter=verbose`

## 6. 验证

- [x] **运行测试**
  - 执行 `pnpm test:run` 确认所有现有测试通过
  - 如有失败，分析是否为测试 mock 适配问题并修复

- [x] **运行类型检查**
  - 执行 `pnpm tsc` 确认无类型错误

- [x] **运行 lint**
  - 执行 `pnpm lint` 确认无 lint 错误
