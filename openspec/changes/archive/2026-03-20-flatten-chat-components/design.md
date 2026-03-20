## Why

Chat 页面组件嵌套层级过深（7层），且 `ChatPanelContent` 使用布尔属性控制两种渲染模式，导致：
- 导入路径冗长，可读性差
- 重构困难，牵一发动全身
- 组件内部条件分支复杂，难以独立修改
- 违反 Vercel Composition Patterns 的 `architecture-avoid-boolean-props` 规则

现在进行重构是因为 React 架构审查已识别此问题为 **P1 优先级**，且项目正处于稳定迭代期，适合进行技术债务清理。

## What Changes

- 将 `pages/Chat/components/` 下的嵌套组件结构扁平化为 4 层
- 组件从嵌套目录移动到平级目录
- 将 `ChatPanelContent` 拆分为 `Grid` 和 `Splitter` 两个显式组件
- 提取共享逻辑到 `useBoard` hook（包含 `shouldUseSplitter` 判断）
- 更新所有相关的导入路径
- 保持组件功能和 API 不变

**注意事项**：
- Grid/Splitter 切换时会卸载/挂载组件，内部状态（如滚动位置）会丢失
- 如果需要保持状态，应使用 CSS `display: none` 隐藏而非卸载

**重构前后对比：**

```
# 重构前 (7层嵌套)
pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/DetailTitle.tsx

# 重构后 (4层)
pages/Chat/components/Panel/Detail/Title.tsx
```

## Capabilities

### New Capabilities

- `chat-panel-grid`: 固定网格布局组件，通过 props 接收 board 数据进行渲染
- `chat-panel-splitter`: 可拖拽布局组件，通过 props 接收 board 数据进行渲染
- `use-board-hook`: 共享布局逻辑 hook，负责二维数组计算和 `shouldUseSplitter` 判断

### Modified Capabilities

无。此重构仅改变内部实现架构，不改变需求级别的行为。现有的 `chat-panel-testing` spec 覆盖的行为保持不变。

## Impact

### 受影响的文件

**新增**:
- `src/pages/Chat/components/Panel/Grid.tsx`
- `src/pages/Chat/components/Panel/Splitter.tsx`
- `src/pages/Chat/hooks/useBoard.ts`

**移动/重命名**:
- `src/pages/Chat/components/` 下所有组件文件

**删除**:
- `src/pages/Chat/components/ChatContent/` （重构后不再需要）
- `src/pages/Chat/components/ChatPanel/components/ChatPanelContent/` （拆分为 Grid 和 Splitter）

### 用户体验

- 无直接影响，渲染行为和视觉效果完全不变

### 开发者体验

- 正面：目录层级从 7 层减少到 4 层，导入路径更短
- 正面：组件命名简洁，无冗余前缀
- 正面：组件职责单一，更易理解和维护
- 正面：修改一种布局模式不影响另一种
- 正面：测试更简单，每个组件独立测试
