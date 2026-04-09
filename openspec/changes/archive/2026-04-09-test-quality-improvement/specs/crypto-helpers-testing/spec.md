## ADDED Requirements

### Requirement: AES-256-GCM 加解密往返正确性
测试 SHALL 验证 `encrypt` 和 `decrypt` 函数的加解密往返一致性，明文经加密后再解密 MUST 还原为原始内容。

#### Scenario: 基本加解密往返
- **WHEN** 使用有效密钥对明文进行加密，然后使用相同密钥和返回的 IV 进行解密
- **THEN** 解密结果 MUST 等于原始明文

#### Scenario: 空字符串加解密
- **WHEN** 对空字符串进行加密和解密
- **THEN** 解密结果 MUST 为空字符串

#### Scenario: 长文本加解密
- **WHEN** 对超过 1KB 的文本进行加密和解密
- **THEN** 解密结果 MUST 等于原始文本

#### Scenario: Unicode 文本加解密
- **WHEN** 对包含中文、emoji、特殊 Unicode 字符的文本进行加密和解密
- **THEN** 解密结果 MUST 等于原始文本

### Requirement: IV 唯一性
每次加密操作 MUST 生成唯一的 IV（初始化向量）。

#### Scenario: 相同明文产生不同密文
- **WHEN** 使用相同密钥对相同明文执行两次加密
- **THEN** 两次加密产生的 IV MUST 不同，密文 MUST 不同

### Requirement: 错误解密检测
使用错误密钥解密时 MUST 抛出错误。

#### Scenario: 错误密钥解密
- **WHEN** 使用密钥 A 加密，使用密钥 B 解密
- **THEN** MUST 抛出错误

#### Scenario: 损坏的密文解密
- **WHEN** 使用被篡改的密文进行解密
- **THEN** MUST 抛出错误

### Requirement: 返回值结构验证
`encrypt` 函数 MUST 返回包含 ciphertext 和 iv 的对象。

#### Scenario: 加密返回值结构
- **WHEN** 调用 encrypt 函数
- **THEN** 返回值 MUST 包含 ciphertext（string）和 iv（string）属性
