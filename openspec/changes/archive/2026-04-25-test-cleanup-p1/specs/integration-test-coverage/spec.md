## ADDED Requirements

### Requirement: 集成测试 mock 策略审查与对齐

`src/__test__/integration/` 目录下的测试文件 SHOULD 尽可能使用 `globalThis` 上注册的工厂函数创建 mock。对于当前尚无 globalThis 工厂函数的模块（如 modelStorage、chatStorage、resetAllData 等），MAY 保留直接 `vi.mock()` 方式。

#### Scenario: 已有 globalThis 工厂的模块必须使用

- **WHEN** 集成测试需要 mock 的模块已有对应的 globalThis 工厂函数（如 `__mockI18n` 对应 `react-i18next`、`__createTauriCompatModuleMock` 对应 `@/utils/tauriCompat`）
- **THEN** MUST 使用 globalThis 工厂函数，MUST NOT 直接 `vi.mock()` 硬编码返回值

#### Scenario: master-key-recovery 的 i18n mock 已对齐

- **WHEN** 审查 `master-key-recovery.integration.test.tsx` 的 react-i18next mock
- **THEN** MUST 使用 `globalThis.__mockI18n()`（当前已满足，仅需确认）
- **AND** resetAllData、useResetDataDialog 等尚无 globalThis 工厂的模块 MAY 保留 `vi.mock()`

#### Scenario: 尚无工厂函数的模块保留 vi.mock

- **WHEN** 集成测试需要 mock 的模块（如 modelStorage、chatStorage、chat、titleGenerator）尚无对应的 globalThis 工厂函数
- **THEN** MAY 保留直接 `vi.mock()` 方式，不强制迁移

#### Scenario: 第三方 UI 库 mock 可保留直接 vi.mock

- **WHEN** mock 的目标是第三方 UI 组件库（如 sonner）
- **THEN** 允许保留直接 `vi.mock()` 方式，不强制使用 globalThis 模式

### Requirement: 集成测试命名风格统一为 it()

`src/__test__/integration/` 目录下所有测试文件 MUST 使用 `it()` 而非 `test()` 作为测试用例声明方式，与项目主流风格保持一致。

#### Scenario: integration 目录下 test() 改为 it()

- **WHEN** 扫描 `src/__test__/integration/` 目录下的 `.ts` 文件
- **THEN** MUST NOT 包含顶层 `test()` 调用，SHALL 全部使用 `it()`

#### Scenario: crypto 相关测试文件的 test() 改为 it()

- **WHEN** 扫描 `src/__test__/utils/crypto-*.test.ts` 文件
- **THEN** MUST NOT 包含顶层 `test()` 调用，SHALL 全部使用 `it()`（`crypto-storage-strategy.test.ts` 在重定位时一并处理）
