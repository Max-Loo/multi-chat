# 集成测试覆盖规范

## Purpose

定义集成测试的 mock 策略对齐和命名风格统一标准，确保集成测试使用 globalThis 工厂函数创建 mock，并统一使用 `it()` 声明测试用例。

## Requirements

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

### Requirement: 集成测试 Mock 与窗口模拟互斥原则

集成测试 SHALL NOT 同时使用 `vi.mock` Mock 内部响应式 hook 和设置 `global.innerWidth` + `dispatch(new Event('resize'))` 模拟窗口尺寸。两种机制互斥，Mock 存在时窗口尺寸模拟无效。

#### Scenario: Mock useResponsive 时移除 resize 代码
- **WHEN** 集成测试通过 `vi.mock('@/hooks/useResponsive')` 控制布局模式
- **THEN** MUST NOT 设置 `global.innerWidth` 或调用 `global.dispatchEvent(new Event('resize'))`
- **AND** SHALL 仅通过 Mock 返回值控制布局状态

#### Scenario: 使用真实响应式行为时需要 matchMedia polyfill
- **WHEN** 集成测试意图测试真实的响应式布局切换行为
- **THEN** SHALL NOT Mock `useResponsive`
- **AND** SHALL 提供 `window.matchMedia` polyfill 并通过 `global.innerWidth` 控制视口宽度

---

### Requirement: 测试用例不可重复断言相同结果

同一 describe 块内的测试用例 SHALL NOT 对同一数据断言完全相同的条件或存在包含关系。当存在包含关系时，SHALL 保留断言更严格的用例（超集），删除被包含的用例（子集）。

#### Scenario: 合并步骤名称唯一性测试（包含关系）
- **WHEN** 测试初始化步骤配置的步骤名称唯一性
- **THEN** SHALL 保留断言更严格的用例（包含 Set 比较和步骤数量断言）
- **AND** MUST NOT 保留仅验证等价不变量的冗余用例（如 reduce 计数方式）

#### Scenario: 合并依赖存在性验证测试（等价关系）
- **WHEN** 测试初始化步骤的依赖存在性
- **THEN** SHALL 仅保留带自定义错误消息的用例（便于定位问题）
- **AND** MUST NOT 保留逻辑相同但无错误消息的用例

#### Scenario: 合并字段完整性测试（包含关系）
- **WHEN** 测试初始化步骤配置的字段完整性
- **THEN** SHALL 仅保留断言更完整的用例（defined + typeof + length）
- **AND** MUST NOT 保留仅验证 typeof 的子集用例

#### Scenario: 合并 onError severity 测试（包含关系）
- **WHEN** 测试初始化步骤的 onError 返回值
- **THEN** SHALL 仅保留同时验证 severity 和 message 的用例
- **AND** MUST NOT 保留仅验证 severity 的子集用例

#### Scenario: 合并导出测试（包含关系）
- **WHEN** 测试 initSteps 的导出结构
- **THEN** SHALL 保留 `应该 initSteps 可以正常导入`（包含 defined + Array.isArray）
- **AND** MUST NOT 保留仅检查 Array.isArray 的子集用例

---

### Requirement: 集成测试命名风格统一为 it()

`src/__test__/integration/` 目录下所有测试文件 MUST 使用 `it()` 而非 `test()` 作为测试用例声明方式，与项目主流风格保持一致。

#### Scenario: integration 目录下 test() 改为 it()

- **WHEN** 扫描 `src/__test__/integration/` 目录下的 `.ts` 文件
- **THEN** MUST NOT 包含顶层 `test()` 调用，SHALL 全部使用 `it()`

#### Scenario: crypto 相关测试文件的 test() 改为 it()

- **WHEN** 扫描 `src/__test__/utils/crypto-*.test.ts` 文件
- **THEN** MUST NOT 包含顶层 `test()` 调用，SHALL 全部使用 `it()`（`crypto-storage-strategy.test.ts` 在重定位时一并处理）
