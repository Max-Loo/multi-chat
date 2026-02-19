# test-helper-utilities Spec

## Purpose

提供测试辅助工具库，包含测试数据工厂（fixtures）、断言辅助函数、Mock 调用验证工具，提高测试编写效率和可读性。

## ADDED Requirements

### Requirement: Model 数据工厂

系统 SHALL 提供 `createMockModel()` 函数，用于快速创建测试用的 Model 对象。

#### Scenario: 创建默认 Model

- **WHEN** 调用 `createMockModel()`
- **THEN** 系统返回包含所有必需字段的 Model 对象
- **AND** 所有字段使用合理的默认值

#### Scenario: 覆盖 Model 字段

- **WHEN** 调用 `createMockModel({ apiKey: 'custom-key' })`
- **THEN** 系统返回 `apiKey` 为 `'custom-key'` 的 Model
- **AND** 其他字段保持默认值

#### Scenario: 批量创建 Model

- **WHEN** 调用 `createMockModels(5)`
- **THEN** 系统返回 5 个不同的 Model 对象
- **AND** 每个 Model 的 `id` 唯一

---

### Requirement: 加密测试数据工厂

系统 SHALL 提供 `createCryptoTestData()` 函数，用于生成加密测试所需的固定数据。

#### Scenario: 创建加密测试数据

- **WHEN** 调用 `createCryptoTestData()`
- **THEN** 系统返回包含 `masterKey`、`plaintext`、`ciphertext` 的测试数据对象

#### Scenario: 创建 Unicode 测试数据

- **WHEN** 调用 `createCryptoTestData({ includeUnicode: true })`
- **THEN** 系统 `plaintext` 包含中文、日文、Emoji 等 Unicode 字符

---

### Requirement: 自定义断言函数

系统 SHALL 提供加密相关的自定义断言函数。

#### Scenario: 断言加密格式

- **WHEN** 调用 `expect(value).toBeEncrypted()`
- **THEN** 系统验证 `value` 以 `'enc:'` 前缀开头

#### Scenario: 断言有效密钥格式

- **WHEN** 调用 `expect(key).toBeValidMasterKey()`
- **THEN** 系统验证 `key` 为 64 个十六进制字符

#### Scenario: 断言 Mock 调用

- **WHEN** 调用 `expect(mockFn).toHaveBeenCalledWithService('com.test.app')`
- **THEN** 系统验证 Mock 以指定 service 参数被调用

---

### Requirement: Mock 调用验证工具

系统 SHALL 提供 Mock 调用相关的验证工具函数。

#### Scenario: 验证调用次数

- **WHEN** 调用 `verifyMockCalls(mockFn, 3)`
- **THEN** 系统验证 Mock 被调用恰好 3 次
- **AND** 调用失败时抛出清晰的错误信息

#### Scenario: 验证调用参数

- **WHEN** 调用 `verifyMockCalledWith(mockFn, { service: 'com.test' })`
- **THEN** 系统验证 Mock 至少有一次调用包含指定参数

---

### Requirement: 性能测试工具

系统 SHALL 提供性能测试辅助函数。

#### Scenario: 测量执行时间

- **WHEN** 调用 `measurePerformance(async () => { ... })`
- **THEN** 系统返回执行时间和结果

#### Scenario: 验证性能阈值

- **WHEN** 调用 `expectDuration(asyncFn, 1000)` 且执行时间 < 1000ms
- **THEN** 断言通过

---

### Requirement: 测试数据快照

系统 SHALL 支持测试数据快照功能，便于复杂数据结构的验证。

#### Scenario: 创建数据快照

- **WHEN** 调用 `createSnapshot(data)`
- **THEN** 系统生成数据的序列化快照字符串

#### Scenario: 比较快照

- **WHEN** 调用 `expect(data).toMatchSnapshot('name')`
- **THEN** 系统比较数据与已有快照

---

### Requirement: 辅助函数模块化导出

系统 SHALL 支持按功能模块导入辅助函数。

#### Scenario: 导入数据工厂

- **WHEN** 从 `@/test-helpers/fixtures` 导入
- **THEN** 系统仅导入数据工厂函数

#### Scenario: 导入断言函数

- **WHEN** 从 `@/test-helpers/assertions` 导入
- **THEN** 系统仅导入自定义断言函数
