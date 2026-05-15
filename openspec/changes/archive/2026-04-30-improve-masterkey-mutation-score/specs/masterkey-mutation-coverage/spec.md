## ADDED Requirements

### Requirement: getMasterKey Tauri 环境错误消息精确断言
测试 SHALL 精确验证 Tauri 环境下 `getPassword` 失败时的错误消息内容（现有测试仅使用 `toThrow()`）。

#### Scenario: Tauri 环境 getPassword 失败
- **WHEN** `isTauri()` 返回 `true` 且 `getPassword` 抛出错误
- **THEN** 抛出的错误消息 SHALL 等于 "无法访问系统安全存储，请检查钥匙串权限设置"

### Requirement: storeMasterKey Tauri 环境错误消息精确断言
测试 SHALL 精确验证 Tauri 环境下 `setPassword` 失败时的错误消息内容（现有测试仅使用 `toThrow()`）。

#### Scenario: Tauri 环境 setPassword 失败
- **WHEN** `isTauri()` 返回 `true` 且 `setPassword` 抛出错误
- **THEN** 抛出的错误消息 SHALL 等于 "无法访问系统安全存储，请检查钥匙串权限设置"

### Requirement: importMasterKey 错误类型断言
测试 SHALL 验证格式无效时抛出的错误同时满足 `instanceof InvalidKeyFormatError` 和 `name === 'InvalidKeyFormatError'`。

#### Scenario: 格式无效时错误类型验证
- **WHEN** 密钥格式无效
- **THEN** 抛出的错误 SHALL 为 `InvalidKeyFormatError` 实例，且 `name` 属性为 `'InvalidKeyFormatError'`

### Requirement: 错误 cause 属性断言
测试 SHALL 验证 `getMasterKey` 和 `storeMasterKey` 错误路径中抛出的 `Error` 包含原始错误的 `cause` 属性。

#### Scenario: getMasterKey 错误 cause 属性
- **WHEN** `getPassword` 抛出错误
- **THEN** 抛出的 `Error` 的 `cause` 属性 SHALL 等于原始错误对象

#### Scenario: storeMasterKey 错误 cause 属性
- **WHEN** `setPassword` 抛出错误
- **THEN** 抛出的 `Error` 的 `cause` 属性 SHALL 等于原始错误对象
