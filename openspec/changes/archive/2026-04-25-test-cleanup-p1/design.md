## Context

项目测试套件包含 159 个测试文件、1785 个用例。P0 阶段已清理冗余 cleanup 调用、合并 fixtures。本次 P1 阶段聚焦三个问题：crypto 测试用例重叠、未使用的 mock/fixture 导出、集成测试 mock 策略分裂。

当前状态：
- `crypto-storage.test.ts`（27 个用例）中约 17 个与 `crypto.test.ts`（53 个用例）完全重复
- `crypto-simple.test.ts`（1 个用例）与 `crypto-masterkey.integration.test.ts` 完全重复
- `helpers/mocks/` 和 `helpers/fixtures/` 中 22+ 个导出函数从未被任何测试文件引用
- 集成测试中 4/9 文件未使用统一的 `integration/setup.ts`，6 个文件使用 `test()` 而非项目主流的 `it()`

## Goals / Non-Goals

**Goals:**
- 消除 crypto 测试中约 35 个重复用例，将 `crypto-storage.test.ts` 重新定位为业务策略测试
- 清理所有未使用的 mock/fixture 导出，降低维护负担
- 统一集成测试的 mock 策略和命名风格

**Non-Goals:**
- 不重组测试目录结构（按功能组织 vs 按源码结构，属于独立的 P3 改进）
- 不调整 `setup.ts` 中已有的全局 mock（Skeleton mock 等保持现状作为保护机制）
- 不修改测试基础设施的架构（globalThis 注册模式等）
- 不调整测试覆盖率阈值

## Decisions

### Decision 1: crypto-storage.test.ts 重定位为 crypto-storage-strategy.test.ts

**选择**：重命名文件，删除 17 个重复用例，保留 8-10 个独有业务策略场景。

**替代方案**：将独有场景升级为真正的集成测试（import 真实 modelStorage）。未采用，原因：这些场景测的是「调用方如何使用加密函数的策略」，属于单元测试范畴。真实 modelStorage 的集成验证属于 modelStorage 集成测试的职责，且会与 `crypto-masterkey.integration.test.ts` 产生重叠。

**保留的独有场景**：
- 批量解密失败时保留 enc: 原值（全失败 + 部分失败）
- masterKey 丢失后 enc: 字段置空 + 明文不受影响
- 混合加密状态保存（仅明文被加密）/ 加载（仅密文被解密）
- null 密钥语义区分（静默置空 vs 报错）
- 无效 hex 密钥 + 奇数长度 hex 密钥（移入 `crypto.test.ts`）

### Decision 2: 未使用导出直接删除而非保留备用

**选择**：直接删除 22+ 个未使用的导出函数。

**理由**：这些函数是遗留产物（非刻意预留的工具箱），部分已有 2+ 年未被使用。Git 历史可随时恢复。留着增加的认知成本大于未来的重写成本。

**删除范围**：
- `mocks/aiSdk.ts`：8 个错误场景工厂（`createMockStreamResultWithMetadata`、`createMockAISDKNetworkError` 等）
- `mocks/chatSidebar.ts`：7 个状态工厂（`createMockUnnamedChat`、`createMockDeletedChat` 等）
- `mocks/router.ts`：4 个路由 mock（`createMockSearchParams`、`createNestedRouteParams` 等）
- `mocks/testState.ts`：`createSettingPageSliceState()` — 移除 `export` 关键字（该函数仅被同文件 `createTestRootState()` 内部调用，无外部消费者，但不可直接删除函数定义）
- `fixtures/crypto.ts`：整个文件
- `mocks/chatSidebar.ts`：`createChatButtonMocks()`、`createToolsBarMocks()`

### Decision 3: 集成测试 mock 策略现状审查与对齐

**现状分析**：对 4 个目标文件逐一核实后发现，mock 统一存在基础设施缺口——多数文件 mock 的模块尚无 globalThis 工厂函数：

| 文件 | mock 目标模块 | globalThis 工厂 | 当前方式 |
|------|-------------|----------------|---------|
| app-loading | modelStorage, chatStorage | 无 | vi.mock() |
| master-key-recovery | resetAllData, useResetDataDialog, react-i18next | 仅 i18n 有（`__mockI18n`） | 部分已对齐 |
| toast-system | sonner, @/components/ui/sonner | 无（第三方库） | vi.mock() |
| auto-naming | chat, chatStorage, titleGenerator | 无 | vi.mock() |

**选择**：P1 阶段仅确认已有工厂函数的模块已对齐（master-key-recovery 的 `__mockI18n` 已满足）。尚无工厂函数的模块（modelStorage、chatStorage 等）保留 `vi.mock()` 方式，其工厂函数的创建列为 P2 改进项。

**理由**：`__createTauriCompatModuleMock()` 专门用于 mock `@/utils/tauriCompat` 模块，不适用于 modelStorage、chatStorage 等业务模块。在缺少对应工厂函数的情况下强制迁移会导致 mock 形状不匹配。

**命名风格统一**：6 个使用 `test()` 的文件（全部在 `integration/` 目录的 `.ts`/`.tsx` 文件和 `utils/crypto-*` 文件中）改为 `it()`。其中 crypto 相关文件在重定位时一并处理。

## Risks / Trade-offs

- [Risk] 删除未使用导出后可能影响正在开发中的分支 → Mitigation: Git 历史可恢复，且这些函数已长期无使用者
- [Risk] 重定位 crypto-storage 测试可能遗漏某些边界条件 → Mitigation: 删除前逐条比对确保无独有场景丢失
- [Risk] 集成测试 mock 统一可能引入行为差异 → Mitigation: P1 仅审查确认，不强制迁移尚无工厂函数的模块
