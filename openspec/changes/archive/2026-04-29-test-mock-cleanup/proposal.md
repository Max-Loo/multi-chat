## Why

测试系统审查发现三个 Mock 策略问题：`initSteps.test.ts` 存在大量冗余的重复测试用例（同一断言换个角度测两遍）；三个集成测试文件中 Mock 了 `useResponsive` 同时又设置 `global.innerWidth + dispatch resize`，两套机制互相矛盾；`ChatButton.test.tsx` 重命名测试通过过滤 `dispatch.mock.calls` 检查 action type 来断言，应改为验证 Redux 最终状态。这些问题不影响测试正确性，但增加了维护成本并降低了测试可读性。

## What Changes

- **精简 `initSteps.test.ts` 冗余测试**：合并 5 组重复/包含关系的用例（"步骤名称唯一性"、"依赖存在性验证"、"字段完整性"、"onError severity"、"导出测试"），每组保留断言更严格的用例，删除子集或等价冗余用例
- **清理集成测试中的矛盾代码**：`bottom-nav`、`drawer-state` 两个集成测试文件中，Mock `useResponsive` 后设置 `global.innerWidth` 和 `dispatch resize` 的代码完全无效——移除这些无效的窗口尺寸模拟代码
- **改进 `ChatButton.test.tsx` 重命名测试断言**：将 2 处重命名测试（确认重命名、取消重命名）的 `dispatchSpy.mock.calls.filter` 模式改为验证 Redux 最终状态（`store.getState().chat.chatMetaList[0].name`）

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `test-assertion-migration`：扩展断言迁移范围，增加 dispatch-spy-filter → redux-state-verification 迁移模式
- `integration-test-coverage`：明确集成测试中 Mock 与窗口模拟的互斥原则

## Impact

- `src/__test__/config/initSteps.test.ts` — 精简冗余用例（5 组合并，预计减少约 50 行）
- `src/__test__/integration/bottom-nav.integration.test.tsx` — 移除矛盾的 resize 代码
- `src/__test__/integration/drawer-state.integration.test.tsx` — 移除矛盾的 resize 代码
- `src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx` — 重命名测试断言改为 Redux 状态验证
