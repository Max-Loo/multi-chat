## 1. 准备工作

- [x] 1.1 创建新的目录结构 (`Panel/`, `Panel/Detail/`, `hooks/`, `Placeholder/`, `ModelSelect/`)
- [x] 1.2 确认所有依赖文件的当前位置

## 2. 移动并重命名组件（叶子优先）

### 2.1 Detail 组件
- [x] 2.1.1 移动 `DetailTitle.tsx` → `Panel/Detail/Title.tsx`
- [x] 2.1.2 移动 `RunningChatBubble.tsx` → `Panel/Detail/RunningBubble.tsx`
- [x] 2.1.3 移动 `ChatPanelContentDetail/index.tsx` → `Panel/Detail/index.tsx`

### 2.2 Panel 组件
- [x] 2.2.1 移动 `ChatPanelHeader.tsx` → `Panel/Header.tsx`
- [x] 2.2.2 移动 `ChatPanelSender.tsx` → `Panel/Sender.tsx`
- [x] 2.2.3 移动 `ChatPanelSkeleton.tsx` → `Panel/Skeleton.tsx`
- [x] 2.2.4 移动 `ChatPanel/index.tsx` → `Panel/index.tsx`

### 2.3 Content 层级组件
- [x] 2.3.1 移动 `ChatContent/index.tsx` → `Content/index.tsx`
- [x] 2.3.2 移动 `ModelSelect.tsx` → `ModelSelect/index.tsx`
- [x] 2.3.3 移动 `ModelSelectSkeleton.tsx` → `ModelSelect/Skeleton.tsx`
- [x] 2.3.4 移动 `ChatPlaceholder.tsx` → `Placeholder/index.tsx`

### 2.4 Sidebar 组件
- [x] 2.4.1 移动 `ChatSidebar/index.tsx` → `Sidebar/index.tsx`
- [x] 2.4.2 移动 `ChatSidebar/components/*` → `Sidebar/components/*`

### 2.5 Hooks
- [x] 2.5.1 移动 `useTypedSelectedChat.ts` → `hooks/useSelectedChat.ts`
- [x] 2.5.2 移动 `useIsChatSending.ts` → `hooks/useIsSending.ts`

## 3. 创建共享 Hook

- [x] 3.1 创建 `hooks/useBoard.ts` 文件
- [x] 3.2 实现 `useBoard` hook
  - [x] 3.2.1 导入 `useSelectedChat`（已重命名，原 `useTypedSelectedChat`）
  - [x] 3.2.2 实现 `board` 二维数组计算逻辑
  - [x] 3.2.3 实现 `shouldUseSplitter` 条件判断
  - [x] 3.2.4 返回 `{ board, chatModelList, shouldUseSplitter }`
- [x] 3.3 为 hook 添加中文 JSDoc 注释

## 4. 拆分 ChatPanelContent

- [x] 4.1 创建 `Panel/Grid.tsx`（固定网格布局）
  - [x] 4.1.1 实现 Props 接口（`board: ChatModel[][]`）
  - [x] 4.1.2 从 props 接收 board 数据（不调用 hook）
  - [x] 4.1.3 实现固定网格布局渲染
  - [x] 4.1.4 添加中文 JSDoc 注释
- [x] 4.2 创建 `Panel/Splitter.tsx`（可拖拽布局）
  - [x] 4.2.1 实现 Props 接口（`board: ChatModel[][]`）
  - [x] 4.2.2 从 props 接收 board 数据（不调用 hook）
  - [x] 4.2.3 实现可拖拽布局渲染（保留 React.Fragment 包裹结构）
  - [x] 4.2.4 添加中文 JSDoc 注释
- [x] 4.3 更新 `Panel/index.tsx`
  - [x] 4.3.1 添加 `columnCount` state（初始值为 `chatModelList.length`）
  - [x] 4.3.2 调用 `useBoard(columnCount, isSplitter)` 获取布局数据
  - [x] 4.3.3 导入 `Grid` 和 `Splitter` 组件
  - [x] 4.3.4 实现 `renderContent()` 条件渲染函数
  - [x] 4.3.5 条件逻辑：`shouldUseSplitter` 时使用 `Splitter`，否则使用 `Grid`
  - [x] 4.3.6 将 `board` 作为 props 传递给 Grid/Splitter
  - [x] 4.3.7 替换原有的 `<ChatPanelContent />` 调用
- [x] 4.4 删除旧的 `ChatPanelContent/index.tsx`

## 5. 更新导入路径

### 5.1 组件内部导入
- [x] 5.1.1 更新 `Panel/Detail/` 内部导入为 `@/` 别名
- [x] 5.1.2 更新 `Panel/` 内部导入为 `@/` 别名
- [x] 5.1.3 更新 `Content/` 内部导入为 `@/` 别名
- [x] 5.1.4 更新 `Sidebar/` 内部导入为 `@/` 别名
- [x] 5.1.5 更新 `pages/Chat/index.tsx` 的导入路径

### 5.2 Hooks 导入
- [x] 5.2.1 更新 hooks 内部导入为 `@/` 别名
- [x] 5.2.2 更新使用 hooks 的组件导入路径

## 6. 更新测试文件

- [x] 6.1 更新测试文件中的导入路径
- [x] 6.2 更新测试中的组件名（如 `ChatPanelHeader` → `Header`）
- [x] 6.3 更新测试中的 data-testid（如有变化）

### 受影响的测试文件列表

以下测试文件已更新：

- [x] `src/__test__/components/DetailTitle.test.tsx` - 更新为 `Panel/Detail/Title`
- [x] `src/__test__/components/RunningChatBubble.test.tsx` - 更新为 `Panel/Detail/RunningBubble`
- [x] `src/__test__/components/ChatPanelContentDetail.test.tsx` - 更新为 `Panel/Detail`
- [x] `src/__test__/components/ChatPanelContent.test.tsx` - **已重写**为 `Grid.test.tsx` 和 `Splitter.test.tsx`
- [x] `src/__test__/components/ChatPanel.test.tsx` - 更新为 `Panel`
- [x] `src/__test__/hooks/useTypedSelectedChat.test.tsx` - 更新为 `useSelectedChat`
- [x] `src/__test__/hooks/useIsChatSending.test.ts` - 更新为 `useIsSending`

## 7. 清理与验证

- [x] 7.1 删除旧的嵌套目录结构
- [x] 7.2 运行 TypeScript 编译检查 (`pnpm tsc`) - ✅ 编译通过
- [x] 7.3 运行 lint 检查 (`pnpm lint`) - ✅ 0 warnings, 0 errors
- [x] 7.4 运行完整测试套件 (`pnpm test`) - ✅ 117 个测试文件，1555 个测试用例通过
- [x] 7.5 验证目录层级不超过 4 层
- [x] 7.6 验证 Grid/Splitter 切换功能正常

## 8. 功能验证

- [x] 8.1 启动应用：`pnpm tauri dev`
- [x] 8.2 测试单模型时的固定网格布局
- [x] 8.3 测试多模型时的固定网格布局
- [x] 8.4 测试多模型时切换到可拖拽布局
- [x] 8.5 测试拖拽调整面板大小功能
- [x] 8.6 验证布局切换后状态保持正常

## 9. 文档更新

- [x] 9.1 更新相关文档中的文件路径引用（如有）- 无需更新
- [x] 9.2 更新 CLAUDE.md 中的快速查找表（如有相关）- 无需更新
