## Context

测试系统经过全面审查，确认全局 Mock 层（`setup/mocks.ts`）设计合理。但在 per-test 层面发现三类问题：

1. **冗余测试**：`initSteps.test.ts` 中多个 describe 块内用例断言完全相同的结果，是 AI 生成测试的典型重复模式
2. **矛盾代码**：2 个集成测试（`bottom-nav`、`drawer-state`）同时 Mock `useResponsive` 和设置 `global.innerWidth + dispatch resize`，后者在 Mock 存在时完全无效
3. **实现细节断言**：`ChatButton.test.tsx` 重命名测试通过过滤 `dispatch.mock.calls` 按 action type 断言，应改为验证 Redux 最终状态

当前 `useResponsive` 依赖 `window.matchMedia`，happy-dom 不原生支持。集成测试 Mock 它是合理的——因为测试目标不是响应式系统本身。但矛盾的 resize 代码需要清理。

## Goals / Non-Goals

**Goals:**
- 精简 `initSteps.test.ts` 中 5 组重复/包含关系的用例（步骤名称唯一性、依赖存在性验证、字段完整性、onError severity、导出测试），每组保留断言更严格的用例
- 移除 2 个集成测试（`bottom-nav`、`drawer-state`）中无效的 `global.innerWidth` + `dispatch(new Event('resize'))` 代码
- 将 `ChatButton.test.tsx` 中 2 处重命名测试的 dispatch-spy-filter 断言改为 Redux 状态验证

**Non-Goals:**
- 不修改全局 Mock 策略（审查确认合理）
- 不修改 `ChatButton.test.tsx` 中删除测试的 dispatch 断言（删除操作无可见 UI 变化，受组件层级限制）
- 不引入 E2E 测试框架
- 不修改 `useResponsive` 的 Mock 方式本身

## Decisions

### 决策 1：initSteps.test.ts 合并重复用例而非删除 describe

**选择**：合并同一 describe 中断言有包含关系或等价关系的用例为单个用例，保留断言更严格的版本，保留 describe 分组结构。

**理由**：describe 分组提供了可读的测试报告。部分用例对（如"步骤名称唯一性"）不是完全重复而是包含关系——用例 1 是用例 2 的超集（多了 `names.length === 9`），合并时保留超集版本。保留分组但精简用例可以兼顾可读性和精简性。

**替代方案**：完全删除重复的 describe 块——过于激进，丢失测试报告的结构化信息。

### 决策 2：集成测试移除 resize 代码而非引入 matchMedia polyfill

**选择**：删除 `global.innerWidth = 600` + `global.dispatchEvent(new Event('resize'))` 代码，保留 `useResponsive` Mock。

**理由**：这些测试的目标不是响应式系统。Mock 已经精确控制了布局模式，resize 代码在 Mock 存在时完全没有效果，属于无效代码。引入 matchMedia polyfill 会增加复杂度且无收益。

### 决策 3：ChatButton 重命名测试使用 waitFor + store.getState()

**选择**：将 `dispatchSpy.mock.calls.filter` 改为 `waitFor(() => expect(store.getState().chat.chatMetaList[0].name).toBe('新名称'))`。

**理由**：`editChatName` 是通过 Redux dispatch 执行的，`waitFor` 可以正确处理异步状态更新。直接验证最终状态比检查 dispatch 调用参数更具行为导向。

**替代方案**：验证 UI 上文本变化——但由于 ChatButton 显示的名称来自 `chatMeta` prop（由父组件传入），组件内部重命名 dispatch 后自身不会立即反映变化。验证 Redux 状态是更直接的行为验证。

## Risks / Trade-offs

- **[风险] 精简 initSteps 测试可能丢失有价值的断言** → 缓解：每组保留断言更严格的版本（如"步骤名称唯一性"保留包含 `names.length === 9` 的用例），不丢失任何有价值的检查
- **[风险] waitFor 可能引入时序敏感的测试** → 缓解：`editChatName` 是同步 reducer（非异步 thunk），状态更新应该是同步的，waitFor 仅作为保险
- **[风险] 删除 resize 代码后未来想测试真实响应式行为时需要重新添加** → 缓解：这属于不同测试目标的变更，应在新变更中处理
