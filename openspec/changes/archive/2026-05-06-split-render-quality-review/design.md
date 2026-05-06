## Context

feat/split-render 分支引入了流式增量渲染（StreamingContent）、消息操作（复制/编辑/重新生成）、编辑历史翻页等功能。代码审查发现 4 类问题：

1. **React 契约违反**：StreamingContent 在渲染阶段修改 refs，Strict Mode 下会双重执行
2. **重复代码**：chatHistoryHelper 中 3 个函数共享相同的"计算索引 + 替换数组元素"模式，重复 8 次
3. **memo 保护断裂**：Detail 组件的 messagePairs/historyCallbacks 在流式期间级联重建，导致所有 ChatBubble 失去 memo 保护
4. **Immer 反模式**：在 WritableDraft 上下文中使用扩展运算符创建新数组，而非直接操作 draft

涉及的文件集中在渲染层（StreamingContent、ChatBubble、Detail）和数据操作层（chatHistoryHelper）。

## Goals / Non-Goals

**Goals:**
- 将 StreamingContent 的渲染阶段副作用范围缩小到 useMemo 内/后，降低 Strict Mode 风险
- 提取 chatHistoryHelper 中的重复模式为共享辅助函数
- 修复 Detail 组件流式期间的 memo 保护链路
- 利用 Immer draft 特性优化数组操作
- 清理低价值注释和冗余 DOM 嵌套

**Non-Goals:**
- 不重构组件架构或状态管理方案
- 不引入新的依赖或抽象层
- 不修改数据模型（content: string | string[] 保持不变）
- 不修改用户可见行为（纯内部质量改进）

## Decisions

### 决策 1：StreamingContent refs 逻辑移入 useMemo

**选择**：将 frozenBlocksRef 和 lastSplitPointRef 的读写逻辑从渲染路径移入 `useMemo`，冻结块列表作为 useMemo 的返回值，不再使用 useRef 缓存。

**替代方案**：使用 `useEffect` + 额外的 state 触发重渲染 → 被否决，因为 useEffect 异步执行会导致渲染闪烁（一帧显示旧状态，下一帧才更新）。

**理由**：useMemo 是同步计算，与当前渲染阶段的时序一致。useMemo 的依赖 `[content, isRunning]` 保证了只在内容变化时重新计算。

**算法**：使用 `prevSplitPointRef` 追踪分割点、`lastAppendedStartRef` 保证追加幂等性，配合 useMemo 实现类 append-only 效果：

```typescript
const prevSplitPointRef = useRef(0);
const lastAppendedStartRef = useRef(-1);

const { frozenBlocks, activeStart } = useMemo(() => {
  if (!isRunning) {
    prevSplitPointRef.current = 0;
    return { frozenBlocks: [], activeStart: 0 };
  }
  const splitPoint = findSafeSplitPoint(content);
  const prevSplit = prevSplitPointRef.current;

  // 内容缩短 → 重置
  if (splitPoint < prevSplit) {
    prevSplitPointRef.current = 0;
    return { frozenBlocks: [], activeStart: 0 };
  }

  // 分割点未前进 → 不产生新冻结块
  if (splitPoint === prevSplit) {
    return { frozenBlocks: [], activeStart: prevSplit };
  }

  // 分割点前进 → 只对新增部分计算 HTML
  const newBlock = generateCleanHtml(content.slice(prevSplit, splitPoint));
  prevSplitPointRef.current = splitPoint;
  return { frozenBlocks: [newBlock], activeStart: splitPoint };
}, [content, isRunning]);

// 内容缩短或流式结束 → 清空冻结块缓存
if (activeStart === 0 && frozenBlocksRef.current.length > 0) {
  frozenBlocksRef.current = [];
  lastAppendedStartRef.current = -1;
}

// 幂等追加：仅当 useMemo 产出新冻结块时追加（activeStart 变化表示新计算结果）
if (frozenBlocks.length > 0 && activeStart !== lastAppendedStartRef.current) {
  frozenBlocksRef.current.push(...frozenBlocks);
  lastAppendedStartRef.current = activeStart;
}
```

注意：`prevSplitPointRef` 只在 useMemo 内读取和写入（同步）。冻结块的**持久累积**使用 `frozenBlocksRef` 存储，通过 `lastAppendedStartRef` 保证追加幂等性——仅在 `activeStart` 变化时追加，避免 React 重渲染时重复追加 useMemo 的缓存结果。这保持了 append-only 的性能优势（旧冻结块不重新计算 HTML）。

**frozenBlocksRef 清空逻辑**：当 `isRunning` 从 true 变为 false 或内容缩短触发重置时，useMemo 返回 `activeStart: 0`。渲染体检测到 `activeStart === 0 && frozenBlocksRef.current.length > 0` 时同步清空 `frozenBlocksRef` 并重置 `lastAppendedStartRef`。`prevSplitPointRef` 已在 useMemo 内重置。当 `isRunning` 从 false 变为 true 时，frozenBlocksRef 已为空，从新内容的 splitPoint=0 开始累积。

### 决策 2：提取 resolveTargetIndex 辅助函数 + Immer draft 直接操作

**选择**：在 chatHistoryHelper.ts 中提取一个纯计算辅助函数 `resolveTargetIndex(content, historyIndex?)` 用于消除重复的索引 clamp 逻辑。数组元素替换统一使用 Immer draft 直接赋值（`arr[idx] = value`），不再提取不可变的 `setArrayElement`。

**理由**：经审查验证，chatHistoryHelper 中所有导出函数的参数类型为 `WritableDraft<ChatSliceState>`，全部在 Immer reducer 上下文中调用，不存在非 Immer 调用场景。将"消除重复"（resolveTargetIndex）和"Immer 优化"（直接赋值）合并为一个决策，避免引入一个实际不会被使用的不可变辅助函数。

`resolveTargetIndex` 保留为纯函数（输入 content + historyIndex，输出 clamp 后的索引），可独立测试。数组元素的替换在各函数内直接使用 Immer draft 赋值 `aiMessage.content[idx] = value`，由 Immer 保证不可变性。

### 决策 3：messagePairs 依赖改为 historyList

**选择**：`messagePairs` 的 useMemo 依赖从 `displayList` 改为 `historyList`。配对关系仅由历史消息决定，流式追加的消息不改变已有配对。

**理由**：流式期间 `displayList` 每次 token 都重建（因为 runningChatData.history 是新对象），但历史消息之间的配对关系不变。改依赖为 `historyList` 后，流式期间 messagePairs 保持稳定，historyCallbacks 也不再重建，ChatBubble 的 memo 保护恢复。

### 决策 4：historyCallbacks 依赖改为 historyList

**选择**：`historyCallbacks` 的 useMemo 依赖从 `messagePairs` 改为 `historyList`，内部通过 messagePairs ref 读取最新配对数据。当 historyList 变化时重建回调（覆盖新消息 ID），流式期间 historyList 不变则回调引用稳定。

**理由**：空依赖方案被否决——新消息加入 historyList 后，historyCallbacks Record 中缺少新消息 ID 的回调条目，编辑后翻页会失去配对同步。改依赖为 `historyList` 后：流式 token 到达时 historyList 不变，回调稳定；新消息写入 historyList 时回调重建，覆盖所有消息 ID。构建回调时通过 `messagePairsRef.current` 读取最新配对数据，避免 messagePairs 变化触发重建。

## Risks / Trade-offs

- **StreamingContent 副作用未完全消除**：`prevSplitPointRef` 在 useMemo 内写入，`frozenBlocksRef` 的增量追加和流式结束清空仍在渲染阶段发生。这属于渲染阶段副作用，但范围已从"无条件渲染路径"缩小到"useMemo 计算路径"。React 19 保证 useMemo 单次调用，实际风险低。若将来需兼容 React 18 Strict Mode，应改用 `useState` + `useEffect` 方案（接受一帧延迟）
- **Immer draft 直接操作的类型安全**：TypeScript 类型系统无法区分 Immer draft 和普通对象 → 通过函数签名 `WritableDraft<ChatSliceState>` 参数明确 Immer 上下文
- **messagePairs 依赖变更**：流式新消息追加后不参与配对计算，直到它成为历史消息 → 这是预期行为，新消息没有配对关系
- **isContentEqual 全数组比较**：从 O(1)（末尾元素+长度）改为 O(n)（逐元素比较）。编辑历史数组通常为 1-5 个元素，比较开销远低于 React 重渲染开销，权衡合理
