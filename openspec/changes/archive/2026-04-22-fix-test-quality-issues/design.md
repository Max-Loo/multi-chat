## Context

当前测试系统有 148 个测试文件、1765 个用例，全部通过。二次审查确认了 6 个真实问题，按优先级排列：

1. **P1 — CSS 类断言脆弱**：约 15 个组件测试直接断言 Tailwind 类名（`bg-primary`、`justify-end`），样式重构时大量测试会假性失败
2. **P2 — 全局错误忽略配置架空精细过滤器**：`vite.config.ts` 中 `dangerouslyIgnoreUnhandledErrors: true` 让 setup.ts 中精心编写的 unhandled rejection 过滤器完全失效
3. **P2 — 假定时器泄漏**：`useDebounce.test.ts` 中 `vi.useFakeTimers()` 未配对 `vi.useRealTimers()`
4. **P3 — 集成测试名不副实**：responsive 布局测试 mock 了 `useResponsive` hook 本身，测试只验证了变量赋值而非布局切换
5. **P3 — Store 工厂冗余**：`createMockStore` 仅被 1 个文件使用，可迁移后移除
6. **低 — nonce 测试重复**：crypto.test.ts 中两处 nonce 唯一性测试本质相同

## Goals / Non-Goals

**Goals:**
- 修复测试配置问题，让错误处理过滤器生效
- 修复资源泄漏，确保测试隔离规范
- 渐进式提升断言稳定性，降低样式重构时的测试维护成本
- 清理已废弃的测试工具代码

**Non-Goals:**
- 不做测试覆盖率提升
- 不引入新的测试框架或工具（如 jest-axe、Playwright）
- 不重构测试目录结构
- 不修改 `setup.ts` 的全局 mock 策略

## Decisions

### 决策 1：移除 `dangerouslyIgnoreUnhandledErrors` 而非修补

**选择**：直接移除 `vite.config.ts` 中的 `dangerouslyIgnoreUnhandledErrors: true`

**备选方案**：
- A) 保留全局配置，增强 setup.ts 过滤器 → 不可行，全局配置会静默吞掉所有 rejection，精细过滤器根本不触发
- B) 移除全局配置，依赖 setup.ts 过滤器 → 选择此方案

**理由**：setup.ts 已经有完善的错误模式匹配（`expectedErrorPatterns`），移除全局配置后它才能真正生效。如果出现预期的 rejection 被报告，应该将错误模式加入 `expectedErrorPatterns` 而非全局忽略。

### 决策 2：CSS 断言迁移策略——渐进式、按组件推进

**选择**：为受影响的组件添加 `data-testid`，分批迁移断言

**备选方案**：
- A) 一次性全量迁移 → 风险高，改动面大
- B) 渐进式迁移，每次改一个组件 → 选择此方案

**迁移规则**：
- 布局容器：`data-testid="layout-root"`、`data-testid="main-content"`
- 消息气泡：`data-testid="user-message"`、`data-testid="assistant-message"`
- 保留 `getByRole` 和 `getByText` 优先于 `data-testid`

### 决策 3：responsive 集成测试重构——保留 mock 但修正断言

**选择**：保留 `useResponsive` mock（ResizeObserver mock 复杂度高、ROI 低），但修正断言逻辑

**备选方案**：
- A) 引入 ResizeObserver polyfill + 真实 resize 事件 → happy-dom 对 ResizeObserver 支持有限，实现复杂
- B) 保留 mock，但让组件在渲染前就确定响应式状态，断言组件行为差异 → 选择此方案

**理由**：当前测试的核心问题是断言"自己检查自己"。修正方案是：每次断言前先 `cleanup()` 再用新状态重新 `render()`，然后验证不同状态下的组件渲染差异（如 mobile 下有 BottomNav，desktop 下有 Sidebar）。

### 决策 4：`createMockStore` 迁移策略

**选择**：将 `chatPanel.ts` 中的 `createMockStore` 调用改为 `createTypeSafeTestStore`，然后移除 `createMockStore`

**理由**：仅 1 个消费者，迁移成本极低。

## Risks / Trade-offs

- **[风险] 移除 `dangerouslyIgnoreUnhandledErrors` 后可能出现新的测试失败** → 缓解：先运行完整测试套件，将新增的 unhandled rejection 模式加入 `expectedErrorPatterns`
- **[风险] `data-testid` 污染生产代码** → 缓解：`data-testid` 是测试社区标准实践，对运行时零影响，且比 CSS 类断言更稳定
- **[权衡] responsive 测试保留 mock 意味着不验证真实响应式行为** → 可接受：真正的响应式测试属于 E2E 层面（Playwright），不在单元/集成测试范围内
