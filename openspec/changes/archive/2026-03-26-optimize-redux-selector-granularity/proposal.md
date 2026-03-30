# 提案：优化 Redux Selector 订阅粒度

## 背景

项目已启用 React Compiler（`babel-plugin-react-compiler`），能自动缓存 JSX 和内联回调。但 React Compiler 无法优化 Redux selector 的订阅粒度——当组件通过 `useAppSelector` 订阅了过粗的状态切片时，任何无关的状态变化都会触发组件重渲染。

当前聊天页面存在四个典型的过度订阅问题，导致不必要的级联重渲染。

## 问题分析

### 问题 1：ChatButton 订阅全局 selectedChatId

**文件**：`src/pages/Chat/components/Sidebar/components/ChatButton.tsx:38`

```tsx
const selectedChatId = useAppSelector((state) => state.chat.selectedChatId)
```

每个 `ChatButton` 都独立订阅了 `selectedChatId`。假设聊天列表有 N 个按钮，切换选中任何一个聊天时，N 个 `ChatButton` 全部收到通知并重渲染。虽然外层有 `memo` 且比较函数只看 `id` 和 `name`，但 selector 内部的状态变化先于 memo 比较执行，组件函数体仍会被调用。

**影响范围**：N 个 ChatButton 同时重渲染（N = 聊天列表长度）

### 问题 2：Detail 订阅整个 runningChat

**文件**：`src/pages/Chat/components/Panel/Detail/index.tsx:32`

```tsx
const runningChat = useAppSelector(state => state.chat.runningChat)
```

`runningChat` 的结构是 `Record<chatId, Record<modelId, RunningChatData>>`。组件实际只关心当前选中聊天的当前模型数据，但订阅了整个嵌套对象。当任何聊天、任何模型的发送状态变化时，selector 返回新引用，触发 Detail 重渲染。

**影响范围**：所有 Detail 实例同时重渲染

### 问题 3：useIsSending 订阅整个 runningChat

**文件**：`src/pages/Chat/hooks/useIsSending.ts:19`

```tsx
const runningChat = useAppSelector(state => state.chat.runningChat)
```

`useIsSending` 被 `Detail` 组件调用（第 34-36 行），内部同样订阅了完整的 `runningChat` 嵌套对象。即使 Detail 自身的 `runningChat` selector 收窄，`useIsSending` 仍会因为任何聊天/模型的运行数据变化触发 Detail 重渲染，抵消 Detail 的优化效果。

**影响范围**：通过 `useIsSending` 间接触发 Detail 重渲染，与问题 2 等价

### 问题 4：Title 订阅完整 models 数组

**文件**：`src/pages/Chat/components/Panel/Detail/Title.tsx:22`

```tsx
const models = useAppSelector((state) => state.models.models);
```

组件只需要查找一个模型（`models.find(m => m.id === chatModel.modelId)`），但订阅了整个模型数组。任何模型的增删改都会导致所有 Title 实例重渲染。

**影响范围**：所有 Title 实例同时重渲染

## 变更内容

将上述四个组件/钩子中过粗的 Redux selector 缩小为精确的数据路径，使组件只在真正关心的数据变化时才重渲染。

### 具体策略

1. **ChatButton**：移除内部的 `useAppSelector(selectedChatId)`，改为由父组件 `Sidebar` 订阅一次 `selectedChatId`，通过 props 传入。N 个子组件共享 1 次订阅。

2. **Detail**：将 `state.chat.runningChat` 缩小为 `state.chat.runningChat[selectedChatId]?.[chatModel.modelId]`，只订阅当前聊天当前模型的运行数据。

3. **useIsSending**：将 `state.chat.runningChat` 缩小为 `state.chat.runningChat[selectedChatId]`，只订阅当前选中聊天的运行数据（需检查其下所有模型的 `isSending` 状态）。此优化与 Detail 的优化互为补充，共同确保 Detail 不会因无关数据变化而重渲染。

4. **Title**：将 `state.models.models` + `useMemo(find)` 替换为单个 `useAppSelector`，在 selector 内部完成 `find` 操作。`===` 严格比较已足够（Immer 对未修改对象保持引用不变），无需额外 `shallowEqual`。

## 能力清单

- **chat-button-selector-optimization**：ChatButton 的 selectedChatId 从内部订阅改为 props 传递
- **detail-running-chat-selector**：Detail 的 runningChat selector 缩小到具体 chatId + modelId 路径
- **is-sending-selector**：useIsSending 的 runningChat selector 缩小到具体 chatId 路径
- **title-model-selector**：Title 的 models selector 改为精确查找单个模型
- **chat-button-perf-verification**：通过构造优化前/后两种模式，对比渲染次数和耗时，量化 props 下沉优化的性能收益

## 影响评估

- **改动范围**：3 个组件文件 + 1 个父组件（Sidebar）+ 1 个 hook（useIsSending）
- **风险等级**：低。纯 selector 重构，不改变业务逻辑和渲染输出
- **测试影响**：需同步更新相关测试中的 mock selector
- **性能收益**：聊天列表越长、模型越多，收益越明显。极端场景（50+ 聊天）可减少 90%+ 的不必要重渲染

## 非目标

- 不移除现有的 `React.memo` 包裹（与 React Compiler 共存无副作用）
- 不重构 Redux store 的数据结构（保持现有 `runningChat` 嵌套设计）
- 不处理 ResizeObserver 循环问题（属于独立问题）
- 不合并 ChatPage 的多个独立 selector（属于独立优化）
