## ADDED Requirements

### Requirement: 冗余清理调用不得存在于测试文件中

当全局 setup 已在 `afterEach` 中调用 `vi.clearAllMocks()` 时，任何测试文件不得在文件级 `beforeEach` 或 `afterEach` 中重复调用 `vi.clearAllMocks()`。

#### Scenario: 测试文件仅包含冗余清理调用
- **WHEN** 某个测试文件的 `beforeEach`/`afterEach` 块中仅有 `vi.clearAllMocks()` 一条语句
- **THEN** 该 `beforeEach`/`afterEach` 块应被整体删除

#### Scenario: 测试文件包含清理调用和其他逻辑
- **WHEN** 某个测试文件的 `beforeEach`/`afterEach` 块中除 `vi.clearAllMocks()` 外还有其他语句
- **THEN** 仅删除 `vi.clearAllMocks()` 那一行，保留其余逻辑和钩子块结构

### Requirement: Fixtures 不得存在重复定义

同一工厂函数不得在多个文件中定义。`modelProvider` 相关的所有工厂函数（包括 API 响应工厂和 Zod 校验）必须只存在于 `src/__test__/helpers/fixtures/modelProvider.ts`。

#### Scenario: 测试文件导入 modelProvider fixtures
- **WHEN** 测试文件需要 modelProvider 工厂函数
- **THEN** 统一从 `@/__test__/helpers/fixtures` 导入

### Requirement: 未被使用的 helper 函数和转发模块应当删除

当 helper 函数或模块在代码库中无任何消费方时，应予以删除。

#### Scenario: 转发模块被 barrel 间接使用
- **WHEN** 一个转发模块（如 `mocks/redux.ts`）仅重导出另一个模块的内容，且无直接消费方
- **THEN** 删除该转发模块，由 barrel 文件直接从源模块重导出
