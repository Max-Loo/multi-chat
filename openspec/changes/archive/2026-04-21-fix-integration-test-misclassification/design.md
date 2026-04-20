## Context

集成测试 README 定义了清晰的分层 Mock 策略：外部 API 用 MSW mock、存储层用真实实现（fake-indexeddb）、加密层用真实实现、Redux 用真实 Store、React 组件真实渲染。但实际 4 个集成测试文件严重偏离此规范：

| 文件 | 行数 | 核心问题 |
|------|------|---------|
| `crypto-storage.integration.test.ts` | 1327 | 头部声明"所有外部依赖均被 Mock"，只测 encryptField/decryptField 纯函数，零模块协作 |
| `toast-e2e.integration.test.tsx` | 246 | 文件名 "e2e" 误导，spy 验证自身调用（循环论证），与 toast-system 高度重复 |
| `model-config.integration.test.ts` | 746 | 存储层完全 mock，加密链路被绕过，含大量纯单元测试 |
| `toast-system.integration.test.tsx` | 232 | mock 了 Toaster 组件，spy 验证 markReady 调用 |

项目提供了集成测试辅助工具（`getTestStore`、`clearIndexedDB`、`setupTestServer`），但几乎未被这些文件使用。

## Goals / Non-Goals

**Goals:**

- 将 `crypto-storage.integration.test.ts` 重新分类为单元测试并移至正确目录
- 重写 toast 相关测试为真正的集成测试或删除
- 降低 `model-config.integration.test.ts` 的 mock 粒度
- 确保集成测试目录中所有文件符合 README 定义的准入标准

**Non-Goals:**

- 不新增测试用例
- 不修改生产代码
- 不重构 crypto-storage 中冗余的测试内容（属于 P2 清理范围）
- 不引入 Playwright/Cypress 等真正的 E2E 测试工具

## Decisions

### 决策 1：crypto-storage — 移至 utils/ 目录

将 `crypto-storage.integration.test.ts` 移动到 `src/__test__/utils/crypto-storage.test.ts`。文件内容不变（已是合格的单元测试），只需改变位置和文件名。

**替代方案**：重写为真正的集成测试 → 拒绝。1327 行的重写成本过高，且加密+存储的真正集成测试可在未来独立添加。

### 决策 2：toast-e2e — 删除并合并

删除 `toast-e2e.integration.test.tsx`。其内容与 `toast-system.integration.test.tsx` 高度重复，且两者都是 spy 验证而非真正的集成测试。将 toast-system 重写为唯一覆盖 Toast 集成的测试文件。

**替代方案**：重写为 Playwright E2E 测试 → 拒绝。Playwright 不在当前技术栈内，属于 Non-Goals。

### 决策 3：toast-system — mock sonner toast 渲染到 DOM

sonner 的 Toaster 组件依赖 `next-themes` 的 `useTheme()` hook（见 `src/components/ui/sonner.tsx` 第 1 行），项目中没有 ThemeProvider，在 happy-dom 测试环境中无法正常渲染真实 Toaster。因此采用两层 mock 策略：

**层 1 — mock `sonner` 模块的 `toast` 函数**：将 `toast.success/error/warning/info/loading` 改为 DOM 渲染函数，调用时查找页面中 `data-testid="toast-container"` 的容器，将消息文本以 `<div data-testid="toast-message">消息文本</div>` 追加到容器内。

**层 2 — mock `@/components/ui/sonner` 的 Toaster 组件**：渲染一个带 `data-testid="toast-container"` 的空 `<div>` 容器，作为 toast 消息的挂载点。

**验证方式**：测试通过 `screen.findByText('消息文本')` 断言 Toast 消息出现在 DOM 中，替代原来的 spy 验证 `expect(successSpy).toHaveBeenCalledWith(...)`。

**替代方案**：解除所有 mock，添加 ThemeProvider 使真实 Toaster 渲染 → 拒绝。sonner 内部依赖浏览器 portal 机制和 CSS 动画，在 happy-dom 中行为不可预测，且引入 ThemeProvider 增加测试复杂度。

### 决策 4：model-config — 使用真实存储层

使用 `fake-indexeddb`（项目已配置）替代 mock 的 `modelStorage`，使 `saveModelsToJson` 和 `loadModelsFromJson` 使用真实实现。仅 mock 外部 API（keyring 的系统密钥链访问）。同时删除文件中不属于集成测试的纯单元测试（URL 格式验证、加密算法跨平台一致等）。

## Risks / Trade-offs

- **[重写后测试可能因 stricter 断言而失败]** → 预期行为。失败说明之前测试掩盖了真实问题，需根据失败原因修复。
- **[mock sonner toast 函数可能与 toastQueue 内部逻辑耦合]** → mock 目标是 `sonner` 包的 `toast` 函数，`toastQueue` 通过 `import { toast } from "sonner"` 引用它。mock 替换后 toastQueue 的队列、Promise、mobile position 等逻辑仍然走真实路径，只有最终渲染步骤被替换为 DOM 写入，耦合度可控。
- **[使用真实存储层可能增加测试执行时间]** → fake-indexeddb 是内存实现，性能开销极小。
- **[删除 toast-e2e 减少测试数量]** → 该文件提供的是虚假信心（循环论证），删除比保留更有价值。
- **[model-config 移除单元测试部分后覆盖度下降]** → 这些测试应在对应的单元测试文件中存在，不应混入集成测试。
