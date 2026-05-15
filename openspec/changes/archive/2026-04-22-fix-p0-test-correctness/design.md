## Context

当前测试系统存在 3 个正确性缺陷，均经源码验证确认：

1. `ChatPanelSender.test.tsx` 中 2 个测试用例的断言仅检查 DOM 元素存在性，不验证任何行为
2. `vite.config.ts` 的 `dangerouslyIgnoreUnhandledErrors: true` 静默吞掉所有未处理 rejection
3. `app-loading.integration.test.ts` 中 `chatStorage` 和 `storeUtils` 各被 mock 两次，重复块为死代码

这些是纯测试代码问题，不涉及生产代码修改。

## Goals / Non-Goals

**Goals:**
- 消除零信心测试，确保每个测试至少验证一个行为
- 恢复 unhandled rejection 的可见性，让测试能捕获错误处理回归
- 删除死代码，消除维护负担

**Non-Goals:**
- 不重构测试的整体架构
- 不处理 P1/P2 级别的测试质量问题
- 不修改 `setup.ts` 中的 unhandled rejection 处理器（该处理器无法阻止 Vitest 检测 rejection，详见 Decision 2）

## Decisions

### Decision 1: 误判通过测试的修复策略

**选择**: 重写断言为有意义的验证，而非删除测试。

**理由**: 停止按钮 abort 和 compositionEnd 时间戳都是有价值的测试场景，只是断言写错了。删除会丢失测试覆盖意图。

**具体方案**:
- 停止按钮测试：mock `AbortController`，点击后验证 `abort()` 被调用
- compositionEnd 时间戳测试：该时间戳记录是 Safari 兼容性处理，内部状态无法直接断言。改为验证组件在 compositionEnd 事件后行为正确（如不触发发送），或删除此测试

**备选方案**: 直接删除零信心测试（被否决——丢失测试意图）

### Decision 2: dangerouslyIgnoreUnhandledErrors 的处理

**选择**: 分阶段移除——先实验评估影响范围，再逐批修复。

**前提认知**（修正错误假设）:

`vite.config.ts` 行 62-64 的注释已明确指出：
> setup.ts 的 window.unhandledrejection handler 无法阻止 vitest 检测 rejection，因为 vitest 通过 Node.js process 级别监听 unhandledRejection。此配置是 vitest 唯一提供的全局控制机制，移除会导致测试隔离 bug 引发级联失败。

验证确认：
- `setup.ts` 行 333-358 的 `window.addEventListener('unhandledrejection', ...)` 在 Node.js 环境不生效
- `setup.ts` 行 359-383 的 `process.on('unhandledRejection', ...)` 仅抑制 `console.error` 输出，不阻止 Vitest 的内部检测
- `dangerouslyIgnoreUnhandledErrors` 是唯一能阻止 Vitest 将 unhandled rejection 标记为测试失败的机制

因此，移除此配置**必然导致部分测试失败**，而非"处理器自然生效"。

**步骤**:
1. **实验阶段**：在本地分支移除 `dangerouslyIgnoreUnhandledErrors`，运行完整测试套件，收集失败清单
2. **评估阶段**：按文件分类失败项，区分"测试隔离 bug"（测试间 mock 状态泄漏）和"预期的 rejection"（错误处理测试中故意创建的 rejected Promise）
3. **修复阶段**：
   - 测试隔离 bug → 在对应测试中添加 `afterEach(() => vi.restoreAllMocks())` 或类似清理
   - 预期的 rejection → 使用 `expect(...).rejects` 或 `vi.spyOn(console, 'error')` 显式声明
4. **验证阶段**：确认所有测试通过，无 unhandled rejection 警告

**备选方案**: 若失败数量过大（>20），考虑暂时保留 `dangerouslyIgnoreUnhandledErrors`，仅在新增测试中强制禁止此行为（通过自定义 ESLint 规则或 PR review checklist）。

### Decision 3: 重复 mock 块的清理

**选择**: 删除第一组重复块（行 25-34），保留第二组（行 39-48）。

**理由**: 第二组位于 `import` 语句之后，位置更符合 Vitest 的 `vi.mock` 提升语义。两者实现完全相同。

## Risks / Trade-offs

- **[风险] 移除 dangerouslyIgnoreUnhandledErrors 后测试批量失败** → 先实验评估影响范围，若失败数量过大（>20）则启用备选方案（暂时保留配置 + 新测试禁止策略）
- **[风险] compositionEnd 时间戳测试难以断言内部状态** → 可接受删除该测试，因为行为已由其他测试间接覆盖
