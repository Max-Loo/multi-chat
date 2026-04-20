## Context

当前测试套件有 143 个测试文件、1779 个测试用例（7 skipped）。其中 14 个测试使用 `expect(true).toBe(true)` 模式，不验证任何行为。这些占位测试的来源有两种：
1. Router 测试文件（`routeParams`、`routerIntegration`、`navigationGuards`）中预留的扩展点
2. `masterKey.test.ts` 中仅验证"不抛异常"的安全警告测试

当前状态：测试套件全绿通过（143 passed, 0 failed），但占位测试贡献了虚假的覆盖率数字。

## Goals / Non-Goals

**Goals:**
- 测试套件保持全绿状态（0 failed）
- 消除所有 `expect(true).toBe(true)` 占位断言
- 确保 masterKey 安全警告测试验证实际行为

**Non-Goals:**
- 不重构 mock 策略或消除 `as any`（属于 P1 范围）
- 不补充覆盖盲区（属于 P1/P2 范围）
- 不修改测试基础设施（属于 P3 范围）
- 不改变测试框架或配置

## Decisions

### 决策 1：占位测试处理策略

**选择**：删除占位测试

**理由**：占位测试的注释表明它们是"未来扩展点"，但实际从未被实现。保留它们的价值为零（验证无行为），反而降低测试套件的可信度。如果未来需要测试路由功能，应从零编写有意义的测试。

**替代方案**：替换为有意义的行为测试 → rejected，路由测试文件对应的源代码逻辑简单，强行编写测试属于过度测试。

### 决策 2：masterKey 安全警告测试的重写策略

**选择**：将 `expect(true).toBe(true)` 替换为验证 `toastQueue.warning` 调用的断言

**理由**：`handleSecurityWarning` 函数在非 Tauri 环境中的可观察行为是调用 `toastQueue.warning()` 显示安全警告 toast。验证 `toastQueue.warning` 被调用且包含预期消息，比空断言提供了实际的回归保护。具体验证场景：
- Web 环境 + 未 dismissed → `toastQueue.warning` 应被调用
- Tauri 环境 → `toastQueue.warning` 不应被调用
- 已 dismissed → `toastQueue.warning` 不应被调用

**替代方案**：直接删除这三个测试 → rejected，安全警告是重要的安全特性，应保留测试覆盖。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 删除占位测试导致覆盖率数字下降 | 覆盖率数字本身是虚假的，下降反而更真实 |
| masterKey 测试改为验证 toastQueue.warning 调用仍依赖 mock toastQueue | mock toastQueue 已在项目中广泛使用，测试策略一致 |
