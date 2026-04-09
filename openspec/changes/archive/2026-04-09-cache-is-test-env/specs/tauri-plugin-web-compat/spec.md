## ADDED Requirements

### Requirement: isTestEnvironment 结果缓存

系统 SHALL 将 `isTestEnvironment()` 的检测结果在模块加载时计算一次并缓存，后续调用 `getPBKDF2Iterations()` 直接使用缓存值。

#### Scenario: 模块加载时计算并缓存
- **WHEN** `env` 模块被首次导入
- **THEN** 系统 SHALL 在模块作用域计算一次 `isTestEnvironment()` 的结果
- **AND** 将结果存储为模块级私有常量

#### Scenario: getPBKDF2Iterations 使用缓存值
- **WHEN** 调用 `getPBKDF2Iterations()`
- **THEN** 函数 SHALL 使用模块级缓存值而非重新调用 `isTestEnvironment()`
- **AND** 返回值与缓存前完全一致（测试环境 1000，生产环境 100000）

#### Scenario: isTestEnvironment 函数仍可导出
- **WHEN** 外部模块导入 `isTestEnvironment`
- **THEN** 函数 SHALL 保持可用且签名不变
- **AND** 每次调用仍执行完整检测逻辑（不使用缓存）

#### Scenario: 测试 mock 兼容性
- **WHEN** 测试文件使用 `vi.mock()` 覆盖 `env` 模块
- **THEN** mock 实现 SHALL 正常工作
- **AND** `getPBKDF2Iterations()` 返回 mock 中定义的值
