# Spec: crypto-security-validation

**Capability**: crypto-security-validation

**Version**: 1.0.0

**Summary**：增强加密模块的安全性验证，包括密钥长度严格性（256-bit）、Nonce 随机性和唯一性、恶意输入防御。

## ADDED Requirements

### Requirement: 密钥长度严格验证

系统 SHALL 验证加密密钥必须为 256-bit（32 字节/64 hex 字符）。

#### Scenario: 接受 64 个 hex 字符的密钥

- **GIVEN** 密钥为 64 个 hex 字符（0-9, a-f）
- **WHEN** 用户使用该密钥加密数据
- **THEN** 系统应成功生成密钥（`cryptoKey`）
- **AND** 系统应使用 AES-256-GCM 算法（`length: 256`）

#### Scenario: 拒绝非 64 个 hex 字符的密钥

- **GIVEN** 密钥长度不是 64 个字符
- **WHEN** 用户尝试使用该密钥加密数据
- **THEN** 系统应抛出错误
- **AND** 错误消息应明确指出"密钥不能为空"（如果长度为 0）
- **AND** 系统应调用 `hexToBytes()` 验证 hex 格式

#### Scenario: 验证密钥实际转换为 32 字节

- **GIVEN** 密钥为 64 个 hex 字符
- **WHEN** 系统将密钥转换为 `Uint8Array`
- **THEN** 结果应为 32 字节（256-bit）
- **AND** 每个字节应为有效的 hex 值（0-255）

### Requirement: Nonce 随机性和唯一性

系统 SHALL 确保每次加密使用不同的 12 字节 nonce。

#### Scenario: 每次加密生成不同的 nonce

- **GIVEN** 相同的明文和相同的密钥
- **WHEN** 系统执行两次加密操作
- **THEN** 两次加密的密文应不同
- **AND** 密文的最后 12 字节（nonce）应不同
- **AND** 两次密文都应能成功解密为原始明文

#### Scenario: Nonce 为 12 字节

- **GIVEN** 系统生成 nonce
- **WHEN** 生成操作完成
- **THEN** Nonce 应为 12 字节
- **AND** Nonce 应使用 `crypto.getRandomValues()` 生成
- **AND** Nonce 应为加密安全的随机值

#### Scenario: 大量加密的 nonce 唯一性

- **GIVEN** 相同的明文和相同的密钥
- **WHEN** 系统加密 1000 次
- **THEN** 所有 1000 个 nonce 应互不相同
- **AND** 所有 1000 个密文应互不相同
- **AND** 所有 1000 个密文都应能成功解密

### Requirement: 恶意密文格式防御

系统 SHALL 防御恶意或无效的密文格式，避免崩溃或安全漏洞。

#### Scenario: 拒绝非 Base64 的"enc:" 数据

- **GIVEN** 用户提供以 `enc:` 开头但包含非 Base64 字符的数据
- **WHEN** 用户尝试解密该数据
- **THEN** 系统应检测到 Base64 解码失败
- **AND** 系统应抛出"解密敏感数据失败"错误
- **AND** 系统应包含原始错误作为 `cause`

#### Scenario: 拒绝超长的密文

- **GIVEN** 用户提供超长的 `enc:` 数据（如 10000 个字符）
- **WHEN** 用户尝试解密该数据
- **THEN** 系统应尝试解码 Base64
- **AND** 如果解码成功但解密失败（验证失败），应抛出错误
- **AND** 系统不应崩溃或导致内存溢出

#### Scenario: 拒绝不完整的密文

- **GIVEN** 用户提供有效的 Base64 但解码后少于 12 字节（仅 nonce，无密文）
- **WHEN** 用户尝试解密该数据
- **THEN** 系统应检测到数据长度不足
- **AND** 系统应抛出"无效的加密数据格式：数据长度不足"错误

#### Scenario: isEncrypted() 对恶意输入的防御

- **GIVEN** 用户提供恶意输入（如 `"enc:"><script>alert(1)</script>"` 或 `"enc:" + "\x00\x01".repeat(1000)`）
- **WHEN** 系统使用 `isEncrypted()` 检查该输入
- **THEN** 系统应返回 `true`（只要以 `enc:` 开头）
- **AND** 系统不应崩溃或抛出异常
- **AND** 后续解密操作应优雅失败（如果数据无效）

#### Scenario: isEncrypted() 对未加密数据的判断

- **GIVEN** 用户提供各种未加密数据（空字符串、普通字符串、`"enc"`、`"enc:"`、`"en:"`）
- **WHEN** 系统使用 `isEncrypted()` 检查该数据
- **THEN** 系统应返回 `false`
- **AND** 系统应正确识别缺少 `enc:` 前缀的情况

### Requirement: 修改密文后验证失败

系统 SHALL 在密文被修改后拒绝解密（AES-GCM 的认证标签验证）。

#### Scenario: 修改密文字节导致解密失败

- **GIVEN** 已使用密钥加密明文并生成密文
- **WHEN** 攻击者修改密文的任意字节（翻转位）
- **AND** 用户尝试解密修改后的密文
- **THEN** 系统应检测到认证标签验证失败
- **AND** 系统应抛出"解密敏感数据失败，可能是主密钥已更改或数据已损坏"错误

#### Scenario: 修改 nonce 后验证失败

- **GIVEN** 已使用密钥加密明文并生成密文
- **WHEN** 攻击者修改密文的最后 12 字节（nonce）
- **AND** 用户尝试解密修改后的密文
- **THEN** 系统应检测到解密失败
- **AND** 系统应抛出错误
