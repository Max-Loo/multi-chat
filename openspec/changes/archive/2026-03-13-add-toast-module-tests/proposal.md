# Toast 模块测试补充提案

## Why

Toast 模块是应用的全局用户反馈系统，当前测试覆盖率存在关键缺口：
- **ToasterWrapper 组件**：0% 测试覆盖率，这是应用启动的关键组件，负责 Toast 系统初始化和响应式状态同步
- **集成测试**：完全缺失，无法验证 Toast 系统与 Redux、Router 的真实协作场景
- **整体覆盖率**：79.66%，距离 90% 目标尚有差距

现在需要补充测试以确保 Toast 系统的稳定性、可维护性和重构信心。

## What Changes

### 新增测试文件
- **ToasterWrapper 组件单元测试**（8个测试用例）
  - 文件：`src/__test__/lib/toast/ToasterWrapper.test.tsx`
  - 覆盖：响应式状态同步、竞态条件防护、UI 渲染、组件生命周期

- **Toast 系统集成测试**（10个测试用例）
  - 文件：`src/__test__/integration/toast-system.integration.test.ts`
  - 覆盖：应用启动初始化流程、队列积压机制、Redux middleware 与 Toast 集成、响应式位置切换

- **Toast 端到端场景测试**（5个测试用例）
  - 文件：`src/__test__/integration/toast-e2e.integration.test.ts`
  - 覆盖：真实用户操作反馈场景、竞态条件处理、边界情况

### Mock 策略优化
- Mock `useResponsive` Hook 以隔离测试环境
- Mock `toastQueue` 单例以验证交互（不 Mock 内部实现）
- Mock `sonner` 库（系统边界）

### 覆盖率目标
- ToasterWrapper 组件：从 0% → **90%+**
- Toast 模块整体：从 79.66% → **90%+**

## Capabilities

### New Capabilities
- **toast-component-testing**: ToasterWrapper React 组件的单元测试能力，确保组件初始化、响应式状态同步、竞态条件防护和 UI 渲染的正确性

- **toast-integration-testing**: Toast 系统与外部模块（Redux store、Router、useResponsive Hook）的集成测试能力，验证真实应用环境中的协作行为

- **toast-e2e-testing**: Toast 系统的端到端测试能力，模拟真实用户场景下的 Toast 显示、队列处理和错误恢复

### Modified Capabilities
- （无现有规范需要修改）

## Impact

### 受影响的代码
- `src/lib/toast/ToasterWrapper.tsx`（被测组件）

### 新增测试文件
- `src/__test__/lib/toast/ToasterWrapper.test.tsx`（~300行，8个测试）
- `src/__test__/integration/toast-system.integration.test.ts`（~500行，10个测试）
- `src/__test__/integration/toast-e2e.integration.test.ts`（~300行，5个测试）

### 依赖项
- 无新增外部依赖
- 使用现有测试基础设施：`@testing-library/react`、`vitest`、`msw`

### 测试执行
- 预计新增测试执行时间：~2秒
- 总测试数量：从 1528 → 1551（+23个）

### 文档
- 更新 `src/__test__/README.md`（如需要）
- 测试用例遵循项目 BDD 原则和命名规范
