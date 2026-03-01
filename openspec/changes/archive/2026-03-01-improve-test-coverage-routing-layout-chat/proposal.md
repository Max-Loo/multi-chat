## Why

当前项目的三个关键模块测试覆盖率严重不足：
- **src/router**: 0% 覆盖率，路由配置和导航守卫逻辑未测试
- **src/components/Layout**: 0% 覆盖率，布局组件未测试
- **src/pages/Chat/components/ChatContent/components**: 8.13% 覆盖率，聊天内容组件群测试缺失

低测试覆盖率影响代码质量和重构信心，阻碍团队安全地修改和优化这些核心模块。提升这些模块的测试覆盖率将确保系统稳定性，并为未来的功能开发提供可靠的基础。

## What Changes

- **路由配置测试**
  - 添加路由结构验证测试
  - 测试路由导航守卫逻辑
  - 验证路由参数解析

- **Layout 组件测试**
  - 测试布局渲染逻辑
  - 验证响应式行为
  - 测试子组件渲染

- **聊天内容组件群测试**
  - 添加消息渲染组件测试
  - 测试 Markdown 解析功能
  - 验证代码块高亮逻辑
  - 测试用户交互行为

- **覆盖率目标**
  - router: 0% → 80%+
  - Layout: 0% → 70%+
  - ChatContent/components: 8.13% → 80%+

## Capabilities

### New Capabilities
- `test-coverage-quality`: 定义项目测试覆盖率标准和质量要求，包括不同模块的最低覆盖率目标、测试编写规范和测试类型分类（单元测试、集成测试、E2E测试）。

### Modified Capabilities
无。本次变更仅改进测试覆盖率，不改变任何功能需求或用户可见行为。

## Impact

- **受影响的代码**
  - `src/router`: 添加 `src/__test__/router/*.test.ts`
  - `src/components/Layout`: 添加 `src/__test__/components/Layout.test.tsx`
  - `src/pages/Chat/components/ChatContent/components`: 添加/扩展测试文件

- **依赖项**
  - 无新增依赖
  - 使用现有的 Vitest、React Testing Library 和相关测试工具

- **测试套件**
  - 增加约 50-80 个新测试用例
  - 提升总体测试覆盖率约 2-3%
  - 补充关键路径的测试覆盖
