## Overview

此变更对 Chat 页面组件结构进行完整重构，包括目录扁平化、组件命名简化和组件拆分。目标是提高代码可维护性，同时保持功能不变。

## Non-Functional Requirements

### Requirement: 目录结构规范

Chat 页面组件目录层级不应超过 4 层。

#### Scenario: 验证目录层级
- **WHEN** 检查 `src/pages/Chat/components/` 目录结构
- **THEN** 任意组件文件的路径深度不超过 4 层（相对于 `pages/Chat/`）

### Requirement: 导入路径规范

所有组件导入应使用 `@/` 别名，不使用相对路径。

#### Scenario: 验证导入路径
- **WHEN** 检查 Chat 页面组件的导入语句
- **THEN** 所有导入使用 `@/` 别名格式

### Requirement: 组件命名规范

组件命名应简洁，不包含冗余的父级前缀。

#### Scenario: 验证组件命名
- **WHEN** 检查 `Panel/` 目录下的组件
- **THEN** 组件名不包含 "ChatPanel" 前缀（如 `Header.tsx` 而非 `ChatPanelHeader.tsx`）

### Requirement: 显式变体组件

不使用布尔属性控制组件的渲染模式，而是使用显式的变体组件。

#### Scenario: 验证 Grid/Splitter 拆分
- **WHEN** 检查 `Panel/` 目录
- **THEN** 存在 `Grid.tsx` 和 `Splitter.tsx` 两个独立组件
- **AND** 不存在使用 `isSplitter` 布尔属性控制渲染的单一组件

### Requirement: 功能等价性

重构后组件功能与重构前完全一致。

#### Scenario: 组件渲染验证
- **WHEN** Chat 页面加载
- **THEN** 所有组件正常渲染，无运行时错误

#### Scenario: 布局切换验证
- **WHEN** 用户切换 Grid/Splitter 模式
- **THEN** 布局正确切换，状态保持

#### Scenario: 测试通过
- **WHEN** 运行 Chat 页面相关测试
- **THEN** 所有测试通过，覆盖率不低于重构前

### Requirement: Hooks 命名规范

页面级 hooks 应使用简洁的命名，位于 `pages/Chat/hooks/` 目录。

#### Scenario: 验证 hooks 命名
- **WHEN** 检查 `pages/Chat/hooks/` 目录
- **THEN** hooks 命名不包含冗余的 "Typed" 或 "Chat" 前缀
- **AND** `useTypedSelectedChat` 已重命名为 `useSelectedChat`
- **AND** `useIsChatSending` 已重命名为 `useIsSending`
