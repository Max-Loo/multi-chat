## Why

当前项目仅使用 `@ant-design/x` 的两个组件（`Bubble` 和 `Think`），却引入了 **81MB 的依赖**（@ant-design/x 16MB + antd 65MB）。这显著增加了 node_modules 体积和构建包大小，而项目已有的 shadcn/ui + Radix UI 栈足以实现相同功能。移除这个不必要的依赖将减少包体积、提升构建性能，并降低外部依赖的维护复杂度。

## What Changes

- **移除依赖**:
  - 从 `package.json` 移除 `@ant-design/x`
  - 隐式移除 `antd@6.1.0` peer dependency（约 65MB）

- **创建自定义组件**:
  - 创建 `ChatBubble` 组件，替代 `@ant-design/x` 的 `Bubble` 组件
  - 创建 `ThinkingSection` 组件，替代 `@ant-design/x` 的 `Think` 组件

- **更新现有代码**:
  - 重构 `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatBubble.tsx` 以使用新组件
  - 更新相关测试文件

- **保持功能不变**:
  - 聊天气泡的左/右对齐布局
  - AI 推理过程的折叠/展开交互
  - 加载状态显示
  - Markdown 渲染和代码高亮

## Capabilities

### New Capabilities
- `custom-chat-components`: 自定义聊天组件，提供聊天气泡和推理内容展示功能，基于项目现有的 shadcn/ui + Radix UI 栈实现，无需外部重量级依赖。

### Modified Capabilities
*(无 - 这是纯实现替换，不涉及现有功能的需求变更)*

## Impact

**代码变更**:
- `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatBubble.tsx`
- 相关测试文件（如 `ChatBubble.test.tsx`）

**依赖移除**:
- `@ant-design/x` (16MB)
- `antd@6.1.0` (65MB，作为 peer dependency 隐式移除)
- **node_modules 总计减少约 81MB**

**性能优化**:
- 打包体积减小
- 应用加载速度提升
- 构建时间可能缩短

**维护成本**:
- 减少外部依赖复杂度
- 完全控制组件样式和行为
- 代码更易维护和调试

**风险**:
- 低风险：组件逻辑简单，容易实现和测试
- 可回滚：通过 Git 可以快速回退
