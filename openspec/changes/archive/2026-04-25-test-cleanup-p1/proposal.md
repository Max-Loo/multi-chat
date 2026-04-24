## Why

P0 阶段的测试清理（`test-cleanup-p0`）已合并 fixtures、移除冗余 cleanup 调用。但在后续审查中发现：crypto 测试存在严重的用例重叠（27 个中约 17 个与主文件完全重复）、22+ 个 mock/fixture 导出从未被任何测试文件使用、集成测试的 mock 策略和命名风格不统一。这些问题增加了维护成本和新人认知负担。

## What Changes

- 删除 `crypto-simple.test.ts`（仅 1 个用例，与 `crypto-masterkey.integration.test.ts` 完全重复）
- 重定位 `crypto-storage.test.ts`：删除约 17 个与 `crypto.test.ts` 重复的用例，保留 8-10 个独有的业务策略场景（批量容错、masterKey 丢失降级、混合加密状态处理），文件重命名为 `crypto-storage-strategy.test.ts`
- 将 2 个边缘用例（无效 hex 密钥、奇数长度 hex 密钥）从 `crypto-storage.test.ts` 移入 `crypto.test.ts`
- 清理 `helpers/mocks/` 中 22+ 个未使用的导出函数（aiSdk 错误工厂 8 个、chatSidebar 状态工厂 7 个、router mock 4 个、其他 3 个）
- 清理 `helpers/fixtures/crypto.ts` 整个文件（无外部使用者）
- 清理 `helpers/mocks/testState.ts` 中未使用的 `createSettingPageSliceState()` 导出（移除 `export`，保留函数定义供内部调用）
- 审查集成测试 mock 策略：确认已有 globalThis 工厂函数的模块已对齐（master-key-recovery 的 i18n mock），尚无工厂函数的模块（modelStorage、chatStorage 等）保留当前 `vi.mock()` 方式
- 统一集成测试命名风格：6 个使用 `test()` 的文件改为 `it()`，与项目主流一致

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `test-dead-code-removal`: 扩展清理范围，从冗余 cleanup 调用扩展到未使用的 mock/fixture 导出
- `crypto-validation-tests`: 更新 crypto-storage 测试的定位要求，明确其为「加密业务策略单元测试」而非 crypto 函数重复测试；增加删除 crypto-simple.test.ts 的要求
- `integration-test-coverage`: 增加集成测试 mock 策略审查要求（确认已有工厂函数的模块已对齐）和命名风格统一要求

## Impact

- **测试文件变更**：约 15-20 个测试文件需要修改或删除
- **测试用例数量**：预计净减约 35 个重复用例（1785 → ~1750）
- **helpers 模块**：`mocks/aiSdk.ts`、`mocks/chatSidebar.ts`、`mocks/router.ts`、`mocks/testState.ts`、`fixtures/crypto.ts` 需删除未使用导出
- **无生产代码变更**：本次改动仅涉及 `src/__test__/` 目录下的测试代码
- **无 **BREAKING** 变更**：不影响任何公共 API 或测试基础设施
