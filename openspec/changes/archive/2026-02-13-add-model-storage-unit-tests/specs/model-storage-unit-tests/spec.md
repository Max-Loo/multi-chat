## ADDED Requirements

### Requirement: 测试覆盖模型敏感字段加密功能
系统 MUST 提供对 `encryptModelSensitiveFields()` 函数的单元测试覆盖，验证加密逻辑的正确性和边界情况处理。

#### Scenario: 成功加密 API 密钥
- **WHEN** 模型包含明文 API 密钥且主密钥存在
- **THEN** 系统 SHALL 返回加密后的模型对象，其中 `apiKey` 以 "enc:" 前缀开头

#### Scenario: 跳过已加密的 API 密钥
- **WHEN** 模型的 API 密钥已以 "enc:" 开头
- **THEN** 系统 SHALL 保持 API 密钥不变，不重复加密

#### Scenario: 处理空 API 密钥
- **WHEN** 模型的 `apiKey` 为空或未定义
- **THEN** 系统 SHALL 返回原模型对象，不执行加密操作

#### Scenario: 加密失败时抛出错误
- **WHEN** 加密过程中发生错误（如密钥无效）
- **THEN** 系统 SHALL 记录错误日志并抛出包含模型信息的错误对象

### Requirement: 测试覆盖模型敏感字段解密功能
系统 MUST 提供对 `decryptModelSensitiveFields()` 函数的单元测试覆盖，验证解密逻辑的正确性和错误处理。

#### Scenario: 成功解密 API 密钥
- **WHEN** 模型包含以 "enc:" 开头的加密 API 密钥且主密钥有效
- **THEN** 系统 SHALL 返回解密后的模型对象，其中 `apiKey` 为明文

#### Scenario: 跳过明文 API 密钥
- **WHEN** 模型的 API 密钥不以 "enc:" 开头
- **THEN** 系统 SHALL 保持 API 密钥不变

#### Scenario: 解密失败时返回空字符串
- **WHEN** 解密过程中发生错误（如密钥无效或数据损坏）
- **THEN** 系统 SHALL 记录错误日志并将 `apiKey` 设置为空字符串

### Requirement: 测试覆盖模型保存功能
系统 MUST 提供对 `saveModelsToJson()` 导出函数的单元测试覆盖，验证加密和保存流程的完整性。

#### Scenario: 成功保存模型列表
- **WHEN** 调用 `saveModelsToJson()` 并传入有效的模型列表和主密钥存在
- **THEN** 系统 SHALL 加密所有模型的敏感字段并调用 `saveToStore()` 保存数据

#### Scenario: 主密钥不存在时抛出错误
- **WHEN** 调用 `saveModelsToJson()` 但主密钥不存在
- **THEN** 系统 SHALL 抛出错误，提示"主密钥不存在，无法保存敏感数据"

#### Scenario: 批量加密所有模型
- **WHEN** 模型列表包含多个模型
- **THEN** 系统 SHALL 并行加密所有模型，使用 `Promise.all()` 等待所有加密完成

### Requirement: 测试覆盖模型加载功能
系统 MUST 提供对 `loadModelsFromJson()` 导出函数的单元测试覆盖，验证加载和解密流程的正确性。

#### Scenario: 成功加载并解密模型列表
- **WHEN** Store 中存在加密的模型列表且主密钥有效
- **THEN** 系统 SHALL 返回解密后的完整模型列表

#### Scenario: 空模型列表时返回空数组
- **WHEN** Store 中无模型数据或模型列表为空
- **THEN** 系统 SHALL 返回空数组

#### Scenario: 主密钥不存在时返回部分解密的模型
- **WHEN** Store 中存在数据但主密钥不存在
- **THEN** 系统 SHALL 记录警告日志，并返回所有模型的 `apiKey` 为空字符串（对于加密密钥）或原值（对于明文密钥）

#### Scenario: 部分模型解密失败时继续处理
- **WHEN** 某些模型的 API 密钥解密失败
- **THEN** 系统 SHALL 将失败模型的 `apiKey` 设置为空字符串，并返回其他解密成功的模型

### Requirement: 测试覆盖边界情况和错误处理
系统 MUST 提供对各种边界情况和异常场景的测试覆盖，确保代码健壮性。

#### Scenario: 处理不完整的模型对象
- **WHEN** 模型对象缺少某些可选字段
- **THEN** 系统 SHALL 正常处理，不抛出错误

#### Scenario: 并发保存操作
- **WHEN** 同时调用多次 `saveModelsToJson()`
- **THEN** 系统 SHALL 正确处理并发，不丢失数据

#### Scenario: 加密/解密性能测试
- **WHEN** 模型列表包含大量模型（如 100+）
- **THEN** 系统 SHALL 在合理时间内完成加密/解密操作（如 < 1秒）
