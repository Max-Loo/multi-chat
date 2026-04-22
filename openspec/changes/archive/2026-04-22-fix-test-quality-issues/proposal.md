## Why

二次审查发现测试系统存在若干质量问题：`dangerouslyIgnoreUnhandledErrors: true` 全局配置架空了 setup.ts 中精细的 unhandled rejection 过滤器，可能掩盖真实异步 bug；部分测试存在资源泄漏（假定时器未恢复）和验证逻辑无效（集成测试 mock 了被测对象自身）的问题；组件测试中大量 CSS 类名断言与样式实现强耦合，增加维护负担。

## What Changes

- 移除 `vite.config.ts` 中的 `dangerouslyIgnoreUnhandledErrors: true`，让 setup.ts 的精细过滤器生效
- 修复 `useDebounce.test.ts` 中 `vi.useFakeTimers()` 未配对 `vi.useRealTimers()` 的问题
- 重构 responsive 布局集成测试，使测试实际验证布局切换行为而非 mock 变量赋值
- 渐进式将组件测试中的 CSS 类断言迁移为 `data-testid` 或 ARIA 属性断言
- 清理 `helpers/mocks/redux.ts` 中已废弃的 `createMockStore`，将唯一消费者迁移到 `createTypeSafeTestStore`
- 合并 `crypto.test.ts` 中重复的 nonce 唯一性测试

## Capabilities

### New Capabilities
- `test-error-handling-config`: 测试环境的错误处理配置规范——unhandled rejection 过滤策略和 `dangerouslyIgnoreUnhandledErrors` 的使用约束
- `test-assertion-stability`: 测试断言稳定性规范——CSS 类断言的迁移策略、`data-testid` 命名约定、ARIA 属性优先级

### Modified Capabilities
- `test-configuration`: 新增 vite.config.ts 测试配置的审查要求，禁止全局 `dangerouslyIgnoreUnhandledErrors`
- `test-environment-isolation`: 新增假定时器必须配对恢复的规范要求
- `responsive-layout`: 修正集成测试策略，从 mock hook 改为通过 ResizeObserver/窗口事件触发真实响应

## Impact

- **测试配置**：`vite.config.ts`（移除全局错误忽略）、`src/__test__/setup.ts`（可能需要增强过滤器）
- **测试文件**：19 个组件测试文件包含 CSS 类断言，需逐步迁移为 `data-testid`
- **生产代码**：受影响的组件需添加 `data-testid` 属性（仅涉及测试辅助属性，不影响功能）
- **集成测试**：`responsive-layout-switching.integration.test.tsx` 需要较大重构
- **工具代码**：`helpers/mocks/redux.ts` 中的 `createMockStore` 可移除，`chatPanel.ts` 需迁移
