## Why

集成测试目录中存在多个文件名不副实：`crypto-storage.integration.test.ts`（1327 行）头部声明"所有外部依赖均被 Mock"，实际是纯加密函数的单元测试；`toast-e2e.integration.test.tsx` 使用 spy 验证自身调用（循环论证）且文件名 "e2e" 具有误导性；`model-config.integration.test.ts` 存储层被完全 mock，加密链路被绕过；`toast-system.integration.test.tsx` mock 了 Toaster 组件且依赖 spy 验证。这些文件给人以集成测试已覆盖的虚假信心。

## What Changes

- **移动 crypto-storage.integration.test.ts**：将其从 `integration/` 目录移至 `utils/` 目录并重命名为 `crypto-storage.test.ts`（单元测试），因为该文件仅测试 `encryptField`/`decryptField` 纯函数，不涉及任何跨模块协作
- **重写 toast-e2e.integration.test.tsx**：删除循环论证的 spy 验证，改为验证真实用户可见行为（Toast 消息渲染到 DOM），或降级为单元测试并移出集成目录
- **降低 model-config.integration.test.ts 的 mock 粒度**：使用真实存储层（fake-indexeddb）和真实加密链路，仅 mock 外部 API
- **改进 toast-system.integration.test.tsx**：mock `sonner` 模块的 `toast` 函数使其将消息渲染到 DOM，mock `@/components/ui/sonner` 的 Toaster 为消息容器，使用 `screen.findByText()` 验证用户可见行为

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `integration-test-coverage`: 重新定义集成测试目录的准入标准 — 集成测试 SHALL 使用真实存储层和加密链路，仅 mock 外部 API
- `crypto-integration-tests`: 将 `crypto-storage.integration.test.ts` 重新分类为单元测试（移至 `utils/` 目录）
- `toast-e2e-testing`: 重新定义 `toast-e2e` 测试为验证用户可见行为的集成测试
- `toast-integration-testing`: 改进 `toast-system` 集成测试，mock sonner toast 函数渲染到 DOM 容器以验证用户可见行为
- `model-config-integration`: 降低 mock 粒度，使用真实存储层验证模型配置的完整生命周期

## Impact

- **测试文件移动/重命名**：`crypto-storage.integration.test.ts` → `utils/crypto-storage.test.ts`
- **测试文件重写**：`toast-e2e.integration.test.tsx`、`toast-system.integration.test.tsx`
- **测试文件修改**：`model-config.integration.test.ts` 的 mock 策略调整
- **无生产代码影响**：本变更仅涉及测试代码
- **CI 行为变化**：重写后的测试可能因验证更严格而暴露之前被掩盖的问题
