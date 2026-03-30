# 设计：Redux Selector 订阅粒度优化

## 设计原则

1. **最小订阅**：每个组件只订阅自己真正关心的数据路径
2. **props 下沉**：父组件订阅共享状态，通过 props 传递给子组件，避免 N 个子组件各自订阅同一全局状态
3. **不改变业务逻辑**：纯 selector 层面的重构，渲染输出和行为完全不变
4. **兼容 React Compiler**：不与 React Compiler 的自动优化冲突

## 技术方案

### 方案 1：ChatButton — props 下沉（已完成 spec）

**策略**：状态提升 + props 传递

```
变更前：                          变更后：
Sidebar                           Sidebar
├─ useAppSelector(selectedChatId) ← 新增：订阅一次
├─ ChatButton                     ├─ ChatButton
│  ├─ useAppSelector(selectedChatId) ← 删除：改为 props
│  └─ ...                         │  ├─ isSelected (props)  ← 新增
├─ ChatButton                     ├─ ChatButton
│  ├─ useAppSelector(selectedChatId) ← 删除
│  └─ ...                         │  ├─ isSelected (props)
└─ ...                            └─ ...
```

**关键点**：
- `Sidebar` 新增 `useAppSelector((state) => state.chat.selectedChatId)`
- `ChatButtonProps` 新增 `isSelected: boolean`
- `ChatButton` 内的 `chat.id === selectedChatId` 三处全部改为 `isSelected`
- `memo` 比较函数增加 `isSelected` 比较

### 方案 2：Detail — selector 路径收窄

**策略**：将粗粒度 selector 替换为精确路径

```typescript
// 变更前
const runningChat = useAppSelector(state => state.chat.runningChat)
// 使用：runningChat[selectedChat.id]?.[chatModel.modelId]

// 变更后
const runningChatData = useAppSelector(state =>
  state.chat.runningChat[selectedChat?.id]?.[chatModel.modelId]
)
// 使用：runningChatData
```

**关键点**：
- `useEffect` 依赖从 `runningChat` 改为 `runningChatData`
- JSX 中 `runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage` 简化为 `runningChatData?.errorMessage`
- `selectedChat?.id` 在 `useSelectedChat()` 中已可用，无需额外订阅

### 方案 3：useIsSending — selector 路径收窄一级

**策略**：将粗粒度 selector 收窄到当前 chatId

```typescript
// 变更前
const runningChat = useAppSelector(state => state.chat.runningChat)
// 使用：runningChat[selectedChat.id]

// 变更后
const currentChatRunning = useAppSelector(state =>
  state.chat.runningChat[selectedChat?.id]
)
// 使用：currentChatRunning
```

**关键点**：
- `useMemo` 依赖从 `runningChat` 改为 `currentChatRunning`
- `Object.values(currentChatRunning).some(item => item.isSending)` 逻辑不变
- 与 Detail 的精确路径 selector 互为补充：Detail 收窄到 chatId+modelId，useIsSending 收窄到 chatId（因为它需要检查当前聊天下所有模型的发送状态）

### 方案 4：Title — selector 内查找

**策略**：将 `useAppSelector(models)` + `useMemo(find)` 合并为单个 selector

```typescript
// 变更前
const models = useAppSelector((state) => state.models.models);
const currentModel = useMemo(() => {
  return models.find((model) => model.id === chatModel.modelId);
}, [chatModel, models]);

// 变更后
const currentModel = useAppSelector((state) =>
  state.models.models.find((model) => model.id === chatModel.modelId)
)
```

**关键点**：
- `===` 严格比较已足够：Redux Toolkit Immer 对未修改的对象保持引用不变
- 无需 `shallowEqual`，因为 `find` 返回的是数组中的对象引用
- `useMemo` 不再需要，可以清理导入（如果该文件中没有其他 `useMemo` 使用）

## 改动文件清单

| 文件 | 改动类型 | 改动内容 |
|------|----------|----------|
| `src/pages/Chat/components/Sidebar/index.tsx` | 修改 | 新增 `selectedChatId` selector，传 `isSelected` props |
| `src/pages/Chat/components/Sidebar/components/ChatButton.tsx` | 修改 | 移除 `useAppSelector`，新增 `isSelected` props，更新 memo 比较函数 |
| `src/pages/Chat/components/Panel/Detail/index.tsx` | 修改 | 缩小 `runningChat` selector 路径，更新使用点 |
| `src/pages/Chat/hooks/useIsSending.ts` | 修改 | 缩小 `runningChat` selector 路径到当前 chatId |
| `src/pages/Chat/components/Panel/Detail/Title.tsx` | 修改 | 合并 `useAppSelector` + `useMemo` 为单个 selector |

## 测试策略

### 单元测试

现有测试应全部通过，因为：
- 组件的渲染输出不变
- 组件的行为（点击、删除、重命名）不变
- 只是内部数据获取方式变化

### 需要检查的测试文件

- `src/__test__/components/ChatPanelContentDetail.test.tsx` — mock store 结构可能需要适配
- `src/__test__/components/DetailTitle.test.tsx` — mock store 中 models 数据格式
- `src/__test__/components/ChatPanel.test.tsx` — 大量 `runningChat: {}` mock
- `src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx` — `isSelected` props 适配

### 不需要改动的测试

如果测试中使用 `renderWithProviders` 并传入完整的 mock store，selector 变化对测试透明，无需修改。

## 风险分析

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| selector 返回 undefined 导致崩溃 | 低 | 中 | 所有使用点已有 `isNil` / `?.` 防护 |
| React Compiler 与手动优化冲突 | 极低 | 低 | React Compiler 会跳过已优化的代码 |
| 测试 mock 需要大量修改 | 中 | 低 | 测试中使用完整 store mock，selector 变化透明 |
| useIsSending 收窄后遗漏其他 chatId 的 isSending 状态 | 极低 | 低 | useIsSending 本身只关心 selectedChat 的发送状态 |
