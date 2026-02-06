## ADDED Requirements

### Requirement: 敏感字段加密存储
对于标记为敏感的字段（如 API 密钥），系统在将数据保存到 JSON 文件前 SHALL：
1. 从 `tauri-plugin-keyring` 获取主密钥
2. 使用 Web Crypto API 和主密钥进行 AES-256-GCM 加密
3. 将加密结果以特定格式存储

#### Scenario: 保存包含 API 密钥的模型配置
- **WHEN** 用户保存包含 API 密钥的模型配置
- **THEN** 系统 SHALL 从 `tauri-plugin-keyring` 获取主密钥
- **AND** 系统 SHALL 使用 Web Crypto API 和主密钥对 apiKey 字段值进行 AES-256-GCM 加密
- **AND** 系统 SHALL 生成随机 nonce（12 bytes）用于每次加密
- **AND** 系统 SHALL 将加密结果（ciphertext + auth tag）与 nonce 一起 base64 编码
- **AND** 系统 SHALL 在编码后的字符串前添加 "enc:" 前缀
- **AND** 系统 SHALL 将带有前缀的加密字符串存入 JSON 文件

### Requirement: 敏感字段解密读取
当从 JSON 文件读取数据时，系统 SHALL 识别带有 "enc:" 前缀的字段值，使用从 `tauri-plugin-keyring` 获取的主密钥，并通过 Web Crypto API 进行解密还原为原始明文值。

#### Scenario: 加载包含加密 API 密钥的模型配置
- **WHEN** 应用加载模型配置数据
- **AND** 字段值以 "enc:" 开头
- **THEN** 系统 SHALL 从 `tauri-plugin-keyring` 获取主密钥
- **AND** 系统 SHALL 使用 Web Crypto API 和主密钥进行解密
- **AND** 系统 SHALL 去除 "enc:" 前缀
- **AND** 系统 SHALL 对剩余部分进行 base64 解码
- **AND** 系统 SHALL 提取 nonce（前 12 bytes）和密文（剩余部分）
- **AND** 系统 SHALL 使用 Web Crypto API 和主密钥进行 AES-256-GCM 解密
- **AND** 系统 SHALL 将解密后的明文值加载到内存中

### Requirement: 加密失败处理
当加密操作失败时（如主密钥不可用），系统 SHALL 显示错误提示，并阻止包含敏感字段的数据被保存为明文。

#### Scenario: 主密钥丢失时的保存操作
- **WHEN** 用户尝试保存包含 API 密钥的模型配置
- **AND** `tauri-plugin-keyring` 无法读取主密钥
- **THEN** 系统 SHALL 显示错误提示"加密密钥不可用，无法保存敏感数据"
- **AND** 系统 SHALL 阻止保存操作
- **AND** 系统 SHALL 建议用户检查系统安全存储或重启应用

### Requirement: 解密失败处理
当解密操作失败时（如密文损坏或主密钥变更），系统 SHALL 将该字段值标记为无效，并提示用户重新配置该敏感字段。

#### Scenario: 主密钥变更后的数据加载
- **WHEN** 应用加载模型配置数据
- **AND** 发现加密的 API 密钥字段
- **AND** 使用当前主密钥解密失败（认证标签验证失败）
- **THEN** 系统 SHALL 将该字段值设置为空字符串或特殊标记值
- **AND** 系统 SHALL 在模型列表中显示"需要重新配置 API 密钥"的警告图标
- **AND** 系统 SHALL 记录警告日志说明解密失败的原因

### Requirement: 非敏感字段明文存储
非敏感字段（如模型名称、API 地址）SHALL 以明文形式存储在 JSON 文件中，不进行加密处理。

#### Scenario: 保存普通模型信息
- **WHEN** 用户保存模型配置
- **AND** 字段为 name、apiAddress、modelName 等非敏感字段
- **THEN** 系统 SHALL 直接将明文值存入 JSON 文件
- **AND** 不添加 "enc:" 前缀
- **AND** 不进行任何加密操作
