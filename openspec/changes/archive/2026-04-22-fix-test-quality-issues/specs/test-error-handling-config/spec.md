## ADDED Requirements

### Requirement: 测试环境未处理 Promise rejection 的可见性

Vitest 配置中 SHALL NOT 使用 `dangerouslyIgnoreUnhandledErrors: true`，除非满足以下全部条件：
1. 已确认 `src/__test__/setup.ts` 的 `window.unhandledrejection` handler 无法阻止 Vitest 进程级别的 unhandled rejection 检测（技术限制）
2. 配置保留时 SHALL 附带注释说明技术原因，注释 SHALL 包含 "setup.ts 的 window handler 无法阻止 vitest 检测 rejection" 关键信息
3. 当 Vitest 或测试环境升级时，SHALL 重新评估此豁免是否仍然必要

#### Scenario: 保留全局错误忽略时须有技术依据
- **GIVEN** `src/__test__/setup.ts` 的 DOM 级 `unhandledrejection` handler 无法拦截 Vitest 的 Node.js process 级检测
- **WHEN** `vite.config.ts` 保留 `dangerouslyIgnoreUnhandledErrors: true`
- **THEN** 配置上方 SHALL 有注释解释该技术限制
- **AND** 注释 SHALL 说明移除此配置会导致测试隔离 bug 引发级联失败

#### Scenario: 新的预期 rejection 模式需注册
- **WHEN** 某个测试产生预期的 rejection（如错误处理测试）
- **THEN** 该 rejection 的错误模式 SHALL 被记录在 `setup.ts` 的 `expectedErrorPatterns` 中，即使当前被 `dangerouslyIgnoreUnhandledErrors` 全局吞掉
- **AND** 当未来移除全局忽略时，这些模式 SHALL 用于精细过滤

### Requirement: 假定时器必须配对恢复

使用 `vi.useFakeTimers()` 的测试文件 SHALL 在 `afterEach` 或 `afterAll` 中调用 `vi.useRealTimers()` 恢复真实定时器。

#### Scenario: useDebounce 测试的定时器清理
- **WHEN** `useDebounce.test.ts` 的 `afterEach` 执行
- **THEN** SHALL 调用 `vi.useRealTimers()` 恢复真实定时器，避免影响后续测试
