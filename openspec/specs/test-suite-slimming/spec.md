# test-suite-slimming Specification

## Purpose

规定测试套件精简重构期间与完成后的可验证约束：同构用例参数化、重复用例去重、mock 样板收敛、本地工厂统一，以及「测试全通过、覆盖率不降级」的验收底线，确保删减的只是冗余而非行为覆盖。

## Requirements

### Requirement: 同构用例必须参数化

同一测试文件内连续多个测试用例仅相差输入值或单个字段、断言结构相同时，MUST 合并为单个 `it.each`/`test.each` 参数化用例。项目内已存在参数化正例（如 `crypto.test.ts` 的 Unicode 往返测试）时，邻近的同构非参数化用例 MUST 一并参数化。

#### Scenario: 连续同构布尔断言合并

- **WHEN** `resourceLoader.test.ts` 中存在 17 个连续的 `isNetworkError` 用例，每个仅差 error 构造参数
- **THEN** 合并为 1 个 `it.each` 用例，行为分支覆盖不变，用例数减少 16

#### Scenario: 双版本派生测试合并

- **WHEN** `keyringMigration.test.ts` 中 V1 与 V2 密钥派生的 PBKDF2 参数断言仅差被测导入函数
- **THEN** 合并为 1 个 `it.each(['V1', 'V2'])` 用例

### Requirement: 重复覆盖用例必须去重

同一被测分支被 2 个及以上逐字重复或断言互相包含的用例覆盖时，MUST 仅保留覆盖最完整的一个。变异测试补测轮次新增的用例在补测目标完成后 MUST 与既有用例合并，不得遗留下同构副本。

#### Scenario: 完全重复的组件用例删除

- **WHEN** `ChatButton.test.tsx` 中存在 3 组逐字重复的 it 块（下拉菜单渲染、图标、点击不导航）
- **THEN** 每组仅保留一个，删除另一个，断言总数不减

#### Scenario: 同分支多重覆盖归并

- **WHEN** `chatSlices.test.ts` 中 `sendMessage.fulfilled` 的「activeChat 不存在不更新 updatedAt」分支被 3 个用例覆盖
- **THEN** 归并为 1 个用例，该分支保持至少一次断言

### Requirement: mock 样板必须收敛到全局或共享工厂

纯默认值即可工作的模块 mock（如无自定义翻译键的 `react-i18next` mock）MUST 提升到全局 setup（`setup/mocks.ts`），测试文件不得再逐份声明；需要局部覆盖的文件 MUST 通过 `vi.mocked()` 覆盖返回值而非重写整个 mock 体。同一 hook 或 UI 库的同构 mock 模板在 3 个及以上文件重复时，MUST 收敛为一个共享工厂（globalThis 注册或 helpers 导出）。

#### Scenario: 默认 i18n mock 全局化

- **WHEN** 19 个测试文件的 `react-i18next` mock 均为无参默认调用
- **THEN** 全局 setup 提供该 mock 后，19 个文件的对应 `vi.mock` 声明整体删除，测试仍通过

#### Scenario: 导航 hook 同构模板工厂化

- **WHEN** 7 个测试文件重复手写 `useNavigateToPage` 的同构 mock 对象
- **THEN** 提供共享 mock 后各文件仅保留单行引用

### Requirement: 测试文件内联工厂必须替换为共享工厂

测试文件内定义的 store 构造、消息构造、mock 结果构造函数，当共享层（`helpers/`、`fixtures/`）已存在等价实现时，MUST 删除本地定义并改用共享实现；共享层不存在且该构造被 2 个及以上文件需要时，MUST 上移到共享层。单个文件独用的构造函数 MAY 保留在文件内。

#### Scenario: 内联 store 工厂替换

- **WHEN** 16 个测试文件各自内联 `createStore`/`createTestStore`，而 `createTypeSafeTestStore` 已被 28 个文件使用
- **THEN** 内联定义全部删除并改用共享工厂与 slice state 工厂组合，测试通过

#### Scenario: AI SDK mock 去重

- **WHEN** `streamProcessor.integration.test.ts` 与 `index.integration.test.ts` 本地重写了 `createMockStreamResult` 与 `createMockAISDKMetadata`
- **THEN** 本地定义删除，改从 `helpers/mocks/aiSdk.ts` 导入，流式行为断言不变

### Requirement: 超大测试文件必须结构化重构

超过 2,000 行的测试文件 MUST 按被测单元归并分散的 describe 分组、提取重复的初始状态构造为文件内 helper，并将仅差配置字段的 store 构造参数化。重构后该文件 MUST 保留全部行为分支覆盖。

#### Scenario: chatSlices 归并与提取

- **WHEN** `chatSlices.test.ts`（3,189 行）中 sendMessage 相关逻辑分散在 18 组 describe、初始状态构造逐字重复约 50 次
- **THEN** describe 按 thunk 归并，重复构造提取为 helper，文件行数下降且 `pnpm test:run` 全部通过

### Requirement: 精简不得降低覆盖与通过性

精简完成后，全部单元测试与集成测试 MUST 通过；`pnpm test:coverage` 报告的各模块行覆盖率与分支覆盖率 MUST 不低于精简前基线；`vite.config.ts` 中的分模块覆盖率阈值 MUST NOT 放松。

#### Scenario: 全量回归验证

- **WHEN** 精简批次全部合入后运行 `pnpm test:run && pnpm test:integration:run && pnpm test:coverage`
- **THEN** 单元测试（基线 169 文件 2,391 用例）与集成测试（基线 9 文件 93 用例）通过数为基线减去被删除的重复用例数且零失败，各模块覆盖率不低于基线

#### Scenario: 删除用例的覆盖守恒

- **WHEN** 删除某重复用例
- **THEN** 其所断言的行为分支仍被至少一个保留用例覆盖，覆盖率报告无下降
