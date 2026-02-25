# Crypto 工具函数测试规范

## ADDED Requirements

### Requirement: hexToBytes 函数测试覆盖

系统 SHALL 测试 `hexToBytes()` 函数在正常和异常情况下的行为。

#### Scenario: 正常转换 - 偶数长度 hex 字符串

- **WHEN** 输入有效的偶数长度 hex 字符串（如 "48656c6c6f"）
- **THEN** 系统应返回对应的 Uint8Array（如 [72, 101, 108, 108, 111]）
- **AND** 返回数组的长度应为 hex 字符串长度的一半

#### Scenario: 正常转换 - 空字符串

- **WHEN** 输入空字符串
- **THEN** 系统应返回空的 Uint8Array（length === 0）

#### Scenario: 异常处理 - 奇数长度 hex 字符串

- **WHEN** 输入奇数长度的 hex 字符串（如 "abc"）
- **THEN** 系统应创建对应长度的 Uint8Array（最后一个字节仅使用单个 hex 字符）
- **AND** 不应抛出异常（当前实现允许此行为）

#### Scenario: 异常处理 - 包含非 hex 字符

- **WHEN** 输入包含非 0-9a-fA-F 字符的字符串（如 "ghij"）
- **THEN** `parseInt()` 应返回 NaN
- **AND** 结果数组中对应位置应为 0（NaN 转换为 0）
- **AND** 不应抛出异常（当前实现行为）

#### Scenario: 正常转换 - 大小写混合

- **WHEN** 输入大小写混合的 hex 字符串（如 "AaBbCc"）
- **THEN** 系统应正确解析并返回对应 Uint8Array

### Requirement: bytesToBase64 函数测试覆盖

系统 SHALL 测试 `bytesToBase64()` 函数在正常和边界情况下的行为。

#### Scenario: 正常转换 - 标准字节数组

- **WHEN** 输入标准 Uint8Array（如 [72, 101, 108, 108, 111]）
- **THEN** 系统应返回正确的 Base64 编码字符串（如 "SGVsbG8="）

#### Scenario: 正常转换 - 空数组

- **WHEN** 输入空的 Uint8Array
- **THEN** 系统应返回空字符串

#### Scenario: 正常转换 - 二进制数据

- **WHEN** 输入包含所有 256 种可能字节值的数组（0-255）
- **THEN** 系统应返回有效的 Base64 编码字符串
- **AND** 解码后应恢复原始字节

#### Scenario: 正常转换 - 特殊字符

- **WHEN** 输入包含不可打印字符的字节数组
- **THEN** 系统应正确转换为 Base64（Base64 可处理任意二进制数据）

### Requirement: base64ToBytes 函数测试覆盖

系统 SHALL 测试 `base64ToBytes()` 函数在正常和异常情况下的行为。

#### Scenario: 正常转换 - 标准 Base64 字符串

- **WHEN** 输入有效的 Base64 字符串（如 "SGVsbG8="）
- **THEN** 系统应返回对应的 Uint8Array

#### Scenario: 正常转换 - 无填充字符的 Base64

- **WHEN** 输入无 "=" 填充的 Base64 字符串
- **THEN** 系统应正确解码（浏览器 atob() 支持）

#### Scenario: 异常处理 - 无效 Base64 字符串

- **WHEN** 输入无效的 Base64 字符串（如 "!!!@#$"）
- **THEN** 浏览器 `atob()` 应抛出异常
- **AND** 测试应捕获此异常并验证错误消息

#### Scenario: 正常转换 - 空字符串

- **WHEN** 输入空字符串
- **THEN** 系统应返回空的 Uint8Array（length === 0）

### Requirement: 转换往返测试

系统 SHALL 验证 hex/bytes/Base64 三种格式之间的往返转换保持数据完整性。

#### Scenario: hex → bytes → hex 往返

- **WHEN** 将 hex 字符串转换为 bytes，再转换回 hex
- **THEN** 最终结果应与原始输入完全一致

#### Scenario: bytes → Base64 → bytes 往返

- **WHEN** 将字节数组转换为 Base64，再转换回 bytes
- **THEN** 最终结果应与原始输入完全一致

#### Scenario: hex → bytes → Base64 → bytes → hex 完整往返

- **WHEN** 执行完整转换链：hex → bytes → Base64 → bytes → hex
- **THEN** 最终结果应与原始输入完全一致
