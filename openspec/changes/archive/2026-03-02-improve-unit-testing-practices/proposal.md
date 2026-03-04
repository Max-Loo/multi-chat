# 改进单元测试实践

## Why

当前单元测试存在过度关注实现细节、Mock 内部组件、测试脆弱等问题，违背了"测试行为而非实现"的核心原则。这导致测试难以维护，重构时频繁失败，降低了测试的价值。现在亟需重构测试策略，提升测试质量和可维护性。

## What Changes

- **移除组件测试中的子组件 Mock**：停止 Mock 内部组件（如 `ChatButton`、`ChatBubble`），通过用户交互测试完整组件树
- **移除 Hooks 测试中的内部实现细节**：停止测试内部函数调用（如 `clearTimeout`），改为测试行为（如防抖延迟是否正确）
- **重构测试目录结构**：从按文件结构组织改为按功能/行为组织（如 `chat-management.test.ts`、`user-authentication.test.ts`）
- **优化 Redux 测试**：减少状态转换细节测试，更多依赖集成测试验证完整行为
- **增加集成测试覆盖**：扩展现有的 `chat-flow.integration.test.ts`，增加更多端到端场景
- **统一测试命名规范**：统一使用"应该 [预期行为] 当 [条件]"的中文命名格式

## Capabilities

### New Capabilities

- **behavior-driven-testing**: 建立行为驱动的测试实践，确保测试关注用户可见行为而非实现细节
- **test-isolation-guidelines**: 测试隔离和 Mock 策略指南，明确何时 Mock、何时不 Mock
- **integration-test-coverage**: 集成测试覆盖范围，定义哪些场景需要集成测试

### Modified Capabilities

（无现有能力的需求级别变更，主要是测试实现层面的改进）

## Impact

**受影响的代码**：
- 所有组件测试文件（`src/__test__/components/`、`src/__test__/pages/`、`src/__test__/hooks/`）
- 部分 Redux 测试文件（`src/__test__/store/`）
- 测试辅助工具和 fixtures

**受影响的测试文件数量**：
- 需要重构的测试文件：约 15-25 个
- 特别是：`ChatPage.test.tsx`、`useDebounce.test.ts`、`modelSlice.test.ts`、`useExistingModels.test.tsx`

**测试覆盖率**：
- 预期覆盖率保持不变（或略微提升）
- 但测试质量和可维护性显著提升

**开发体验**：
- 测试更稳定，重构时不易失败
- 测试更易读懂（测试行为而非实现）
- 测试运行速度可能略微下降（减少 Mock）
