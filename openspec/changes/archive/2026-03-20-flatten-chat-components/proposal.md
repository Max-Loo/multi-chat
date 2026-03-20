## Context

当前 Chat 页面组件结构存在多个问题：

### 1. 目录嵌套过深（7 层）
```
pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/DetailTitle.tsx
```

### 2. 组件命名冗余
- `ChatPanelHeader` → 已在 `ChatPanel/` 下，前缀冗余
- `ChatPanelContentDetail` → 嵌套过深 + 命名过长

### 3. 布尔属性控制渲染模式
```tsx
// ChatPanelContent 使用 isSplitter 控制两种完全不同的渲染
if (isSplitter) return <ResizablePanelGroup>...</ResizablePanelGroup>
return <div>...</div>
```

这违反了 Vercel Composition Patterns 的 `architecture-avoid-boolean-props` 规则，导致：
- 组件内部条件分支复杂，难以独立修改每种布局模式
- 两种布局的代码耦合在一起，降低可维护性
- 测试需要覆盖两种模式及其组合，复杂度高

## Goals / Non-Goals

**Goals:**
- 将组件嵌套层级从 7 层减少到 4 层
- 简化组件命名（去除冗余前缀）
- 拆分 `ChatPanelContent` 为 `Grid` 和 `Splitter` 两个显式组件
- 提取共享逻辑到 `useBoard` hook
- 保持所有组件的功能不变

**Non-Goals:**
- 不改变组件的业务逻辑
- 不引入新的状态管理方案（如 Context）
- 不优化组件性能（这是独立任务）
- 不修改布局的视觉效果

## Decisions

### 决策 1: 新目录结构

**选择**: 适度嵌套 + 功能分组

```
pages/Chat/
├── index.tsx                    # ChatPage
├── components/
│   ├── Sidebar/
│   │   ├── index.tsx            # 原 ChatSidebar
│   │   └── components/          # Sidebar 子组件
│   │       ├── ChatButton.tsx   # 原 ChatSidebar/components/ChatButton
│   │       └── ToolsBar.tsx     # 原 ChatSidebar/components/ToolsBar
│   ├── Content/
│   │   └── index.tsx            # 路由组件，决定显示什么
│   ├── Panel/                   # 聊天面板
│   │   ├── index.tsx            # Panel 主组件
│   │   ├── Header.tsx           # 原 ChatPanelHeader
│   │   ├── Sender.tsx           # 原 ChatPanelSender
│   │   ├── Grid.tsx             # 网格布局（新增）
│   │   ├── Splitter.tsx         # 拖拽布局（新增）
│   │   ├── Detail/              # 详情组件
│   │   │   ├── index.tsx        # 原 ChatPanelContentDetail
│   │   │   ├── Title.tsx        # 原 DetailTitle
│   │   │   └── RunningBubble.tsx # 原 RunningChatBubble
│   │   └── Skeleton.tsx         # 原 ChatPanelSkeleton
│   ├── Placeholder/
│   │   └── index.tsx
│   └── ModelSelect/
│       ├── index.tsx
│       └── Skeleton.tsx
└── hooks/
    ├── useSelectedChat.ts       # 原 useTypedSelectedChat
    ├── useIsSending.ts          # 原 useIsChatSending
    └── useBoard.ts              # 新增：共享布局逻辑
```

**路径深度**: 7 层 → 4 层

**替代方案**:
- 完全扁平化 → 失去组件从属关系
- 保持当前结构 → 问题依旧

### 决策 2: 组件命名简化

**选择**: 使用简短、语义化的名称

| 原名称 | 新名称 | 理由 |
|--------|--------|------|
| `ChatPanelHeader` | `Header` | 已在 `Panel/` 下 |
| `ChatPanelSender` | `Sender` | 已在 `Panel/` 下 |
| `ChatPanelContent` | `Grid` / `Splitter` | 拆分为两个组件 |
| `ChatPanelContentDetail` | `Detail` | 已在 `Panel/` 下 |
| `DetailTitle` | `Title` | 已在 `Detail/` 下 |
| `RunningChatBubble` | `RunningBubble` | 已在 `Detail/` 下 |
| `useTypedSelectedChat` | `useSelectedChat` | 去除冗余的 "Typed" |
| `useIsChatSending` | `useIsSending` | 已在 Chat 页面下 |

### 决策 3: 拆分 ChatPanelContent

**选择**: 将 `ChatPanelContent` 拆分为两个显式组件 + 共享 hook

```tsx
// hooks/useBoard.ts - 共享逻辑
/**
 * 聊天面板布局数据的 hook
 * @param columnCount 每行显示的列数
 * @returns board - 二维数组，每行最多 columnCount 个模型
 * @returns chatModelList - 当前聊天的模型列表
 * @returns shouldUseSplitter - 是否应该使用 Splitter 布局
 */
export function useBoard(columnCount: number, isSplitter: boolean) {
  const { chatModelList } = useSelectedChat();

  // 将数组变成 n*m 的二维数组，每一行最多有 columnCount 个
  const board = useMemo<ChatModel[][]>(() => {
    const list: ChatModel[][] = [];
    for (let i = 0; i < chatModelList.length; i += columnCount) {
      list.push(chatModelList.slice(i, i + columnCount));
    }
    return list;
  }, [columnCount, chatModelList]);

  // 判断是否使用 Splitter 布局
  const shouldUseSplitter = isSplitter && chatModelList.length > 1;

  return { board, chatModelList, shouldUseSplitter };
}

// Panel/Grid.tsx - 固定网格布局
interface GridProps {
  board: ChatModel[][];
}

const Grid: React.FC<GridProps> = ({ board }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pt-12 pb-30">
      <div className="flex flex-col w-full h-full">
        {board.map((row, idx) => (
          <div className="flex w-full flex-1 overflow-y-hidden" key={idx}>
            {row.map((chatModel, cellIdx) => (
              <div
                key={chatModel.modelId}
                className={cn(
                  "relative flex-1 min-w-0 border-gray-300",
                  cellIdx < row.length - 1 && "border-r",
                  idx < board.length - 1 && "border-b",
                )}
              >
                <Detail chatModel={chatModel} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Panel/Splitter.tsx - 可拖拽布局
interface SplitterProps {
  board: ChatModel[][];
}

const Splitter: React.FC<SplitterProps> = ({ board }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pt-12 pb-30">
      <ResizablePanelGroup orientation="vertical">
        {board.map((row, idx) => (
          <React.Fragment key={idx}>
            <ResizablePanel defaultSize={100 / board.length}>
              <ResizablePanelGroup orientation="horizontal">
                {row.map((chatModel, cellIdx) => (
                  <React.Fragment key={chatModel.modelId}>
                    <ResizablePanel defaultSize={100 / row.length}>
                      <div className="relative h-full w-full">
                        <Detail chatModel={chatModel} />
                      </div>
                    </ResizablePanel>
                    {cellIdx < row.length - 1 && <ResizableHandle withHandle />}
                  </React.Fragment>
                ))}
              </ResizablePanelGroup>
            </ResizablePanel>
            {idx < board.length - 1 && <ResizableHandle withHandle />}
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    </div>
  );
}

// Panel/index.tsx - 显式条件渲染
const Panel: React.FC = () => {
  const { chatModelList } = useSelectedChat();
  const [isSplitter, setIsSplitter] = useState(false);
  const [columnCount, setColumnCount] = useState(() => chatModelList.length);

  // 当 chatModelList 变化时重置 isSplitter
  // 避免切换到只有 1 个模型的聊天时仍保持 Splitter 模式
  useEffect(() => {
    setIsSplitter(false);
  }, [chatModelList]);

  // 使用 useBoard hook 获取布局数据
  const { board, shouldUseSplitter } = useBoard(columnCount, isSplitter);

  // 显式条件渲染：根据 shouldUseSplitter 选择组件
  // 注意：切换布局会卸载/挂载组件，内部状态（如滚动位置）会丢失
  // 如果需要保持状态，应使用 CSS display:none 隐藏而非卸载
  const renderContent = () => {
    if (shouldUseSplitter) {
      return <Splitter board={board} />;
    }
    return <Grid board={board} />;
  };

  return (
    <>
      <Header
        columnCount={columnCount}
        setColumnCount={setColumnCount}
        isSplitter={isSplitter}
        setIsSplitter={setIsSplitter}
      />
      {renderContent()}
      <Sender />
    </>
  );
}
```

**理由**:
- 遵循 Vercel Composition Patterns 的 `architecture-avoid-boolean-props` 规则
- 每个组件职责单一，只负责渲染，不负责数据获取
- `useBoard` hook 统一管理数据获取和布局判断，避免重复订阅 store
- Grid/Splitter 接收 board 作为 props，更易于测试
- 条件判断逻辑集中在 hook 中，便于维护

### 决策 4: 共享组件保留

**选择**: 将 `ChatBubble` 等共享组件保留在 `components/chat/`

```
src/components/chat/
├── ChatBubble.tsx       # 保留（跨页面共享）
└── ThinkingSection.tsx  # 保留（跨页面共享）
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 大量文件移动 + 重命名 | Git 历史追踪困难 | 使用 `git mv` 保留历史 |
| 组件拆分可能引入 bug | 运行时错误 | 保持逻辑不变，只拆分渲染 |
| 共享逻辑提取遗漏 | 行为不一致 | 编写单元测试验证 hook 行为 |
| 测试文件需要更新 | 测试失败 | 同步更新测试导入和组件名 |
| 导入路径更新遗漏 | 编译错误 | TypeScript 编译检查 |
| Grid/Splitter 切换时状态丢失 | 用户体验 | 如需保持状态，使用 CSS 隐藏而非卸载 |

## Migration Plan

### 阶段 1: 创建新目录结构
1. 创建 `Panel/`, `Detail/`, `hooks/` 等新目录
2. 不删除旧文件

### 阶段 2: 移动并重命名组件（叶子优先）
1. `DetailTitle.tsx` → `Panel/Detail/Title.tsx`
2. `RunningChatBubble.tsx` → `Panel/Detail/RunningBubble.tsx`
3. `ChatPanelContentDetail/index.tsx` → `Panel/Detail/index.tsx`
4. ... 依此类推

### 阶段 3: 创建共享 hook
1. 创建 `hooks/useBoard.ts`
2. 提取二维数组计算逻辑

### 阶段 4: 拆分 ChatPanelContent
1. 创建 `Panel/Grid.tsx`（使用 useBoard hook）
2. 创建 `Panel/Splitter.tsx`（使用 useBoard hook）
3. 更新 `Panel/index.tsx` 使用条件渲染

### 阶段 5: 更新导入和测试
1. 更新所有组件内部导入为 `@/` 别名
2. 更新测试文件的导入和组件名
3. 运行 TypeScript 编译验证

### 阶段 6: 清理
1. 删除旧的嵌套目录
2. 运行完整测试套件
3. 手动测试 Chat 页面功能

### 回滚策略
如果出现问题：
1. `git checkout --` 恢复所有文件
2. 或使用 `git revert` 回退 commit

## Open Questions

1. **是否需要保留旧的组件名作为别名？**
   - 建议：否，直接使用新名称，通过 TypeScript 编译确保所有引用已更新

2. **hooks 是否应该移动到 `src/hooks/`？**
   - 建议：否，这些是 Chat 页面特定的 hooks，保持在 `pages/Chat/hooks/`
