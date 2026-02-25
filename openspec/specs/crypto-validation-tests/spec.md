# Crypto 输入验证测试规范

## ADDED Requirements

### Requirement: encryptField 密钥格式验证

系统 SHALL 测试 `encryptField()` 函数对无效密钥格式的处理。

#### Scenario: 有效密钥 - 64 字符 hex 字符串

- **WHEN** 输入 64 字符的有效 hex 密钥（如 "a".repeat(64)）
- **THEN** 系统应成功加密明文
- **AND** 返回以 "enc:" 前缀开头的密文

#### Scenario: 无效密钥 - 非 64 字符长度

- **WHEN** 输入长度不是 64 的 hex 字符串（如 32 字符或 128 字符）
- **THEN** `crypto.subtle.importKey()` 应抛出异常
- **AND** 系统应捕获异常并抛出友好的错误消息
- **AND** 错误消息应包含 "加密敏感数据失败，请检查主密钥是否有效"

#### Scenario: 无效密钥 - 包含非 hex 字符

- **WHEN** 输入包含非 hex 字符的 64 字符字符串（如 "x".repeat(64)）
- **THEN** `hexToBytes()` 应返回包含 NaN 的字节数组
- **AND** `crypto.subtle.importKey()` 应抛出异常
- **AND** 系统应捕获异常并抛出友好的错误消息

#### Scenario: 无效密钥 - 空字符串

- **WHEN** 输入空字符串作为密钥
- **THEN** `hexToBytes()` 应返回空字节数组
- **AND** `crypto.subtle.importKey()` 应抛出异常（密钥长度不足）
- **AND** 系统应捕获异常并抛出友好的错误消息

### Requirement: encryptField 明文输入验证

系统 SHALL 测试 `encryptField()` 函数对各种明文输入的处理。

#### Scenario: 正常明文 - 标准字符串

- **WHEN** 输入标准 ASCII 字符串（如 "Hello, World!"）
- **THEN** 系统应成功加密
- **AND** 返回的密文应带有 "enc:" 前缀
- **AND** 每次加密应产生不同的密文（因为使用随机 nonce）

#### Scenario: 正常明文 - 空字符串

- **WHEN** 输入空字符串作为明文
- **THEN** 系统应成功加密
- **AND** 返回的密文应带有 "enc:" 前缀

#### Scenario: 正常明文 - Unicode 字符

- **WHEN** 输入包含 Unicode 字符的字符串（如中文 "你好世界"、emoji "🔐"）
- **THEN** 系统应使用 UTF-8 编码正确加密
- **AND** 解密后应恢复原始 Unicode 字符

#### Scenario: 正常明文 - 超长字符串

- **WHEN** 输入超长字符串（如 > 1MB 的文本）
- **THEN** 系统应成功加密
- **AND** 不应出现性能问题或内存溢出

### Requirement: decryptField 密文格式验证

系统 SHALL 测试 `decryptField()` 函数对无效密文格式的处理。

#### Scenario: 有效密文 - 标准 enc: 格式

- **WHEN** 输入以 "enc:" 开头的有效密文
- **THEN** 系统应成功解密
- **AND** 返回原始明文

#### Scenario: 无效密文 - 缺少 enc: 前缀

- **WHEN** 输入不以 "enc:" 开头的字符串（如 "SGVsbG8="）
- **THEN** 系统应立即抛出错误
- **AND** 错误消息应为 "无效的加密数据格式：缺少 enc: 前缀"

#### Scenario: 无效密文 - enc: 后无数据

- **WHEN** 输入只有 "enc:" 前缀而无实际数据的字符串
- **THEN** 系统应在尝试解码 Base64 时失败
- **AND** 抛出 "解密敏感数据失败" 错误

#### Scenario: 无效密文 - 无效的 Base64 数据

- **WHEN** 输入 "enc:" 后跟无效 Base64 字符串（如 "enc:!!!"）
- **THEN** `atob()` 应抛出异常
- **AND** 系统应捕获并抛出 "解密敏感数据失败" 错误

### Requirement: decryptField 密文长度验证

系统 SHALL 测试 `decryptField()` 函数对密文长度的验证。

#### Scenario: 有效密文 - 正确的 nonce 长度

- **WHEN** 输入包含正确 12 字节 nonce 的密文
- **THEN** 系统应成功分离密文和 nonce
- **AND** 成功解密数据

#### Scenario: 无效密文 - 数据长度不足

- **WHEN** 输入的解码后数据长度 ≤ 12 字节（nonce 长度）
- **THEN** 系统应检测到 `ciphertextLength <= 0`
- **AND** 抛出 "无效的加密数据格式：数据长度不足" 错误

#### Scenario: 无效密文 - 密文部分为空

- **WHEN** 输入只有 nonce（12 字节）而无实际密文的数据
- **THEN** 系统应检测到数据长度不足
- **AND** 抛出 "无效的加密数据格式：数据长度不足" 错误

### Requirement: decryptField 密钥验证

系统 SHALL 测试 `decryptField()` 函数对错误密钥的处理。

#### Scenario: 错误密钥 - 不同的 64 字符 hex 字符串

- **WHEN** 使用错误的密钥解密有效密文
- **THEN** `crypto.subtle.decrypt()` 应验证失败（AES-GCM 认证标签不匹配）
- **AND** 系统应捕获 OperationError 异常
- **AND** 抛出友好的错误消息："解密敏感数据失败，可能是主密钥已更改或数据已损坏"

#### Scenario: 错误密钥 - 相似但不同的密钥

- **WHEN** 使用与正确密钥只有少量字符不同的密钥
- **THEN** 系统应验证失败
- **AND** 抛出相同的友好错误消息

### Requirement: isEncrypted 函数验证

系统 SHALL 测试 `isEncrypted()` 函数的正确性。

#### Scenario: 已加密字符串 - 标准 enc: 前缀

- **WHEN** 输入以 "enc:" 开头的字符串
- **THEN** 系统应返回 true

#### Scenario: 未加密字符串 - 无 enc: 前缀

- **WHEN** 输入不以 "enc:" 开头的字符串
- **THEN** 系统应返回 false

#### Scenario: 边界情况 - 空字符串

- **WHEN** 输入空字符串
- **THEN** 系统应返回 false

#### Scenario: 边界情况 - 只有部分前缀

- **WHEN** 输入 "enc" 或 "en:" 等不完整前缀
- **THEN** 系统应返回 false
