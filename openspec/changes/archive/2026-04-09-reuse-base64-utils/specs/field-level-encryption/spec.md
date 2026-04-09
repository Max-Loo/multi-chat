## MODIFIED Requirements

### Requirement: 敏感字段加密存储
对于标记为敏感的字段（如 API 密钥），系统在将数据保存到 JSON 文件前 SHALL：
1. 从 `tauri-plugin-keyring` 获取主密钥
2. 使用 Web Crypto API 和主密钥进行 AES-256-GCM 加密
3. 将加密结果以特定格式存储
4. base64 编解码 SHALL 统一使用 `bytesToBase64` 工具函数（来自 `@/utils/crypto`），禁止使用手写的 `btoa(String.fromCharCode(...))` 模式

#### Scenario: 保存包含 API 密钥的模型配置
- **WHEN** 用户保存包含 API 密钥的模型配置
- **THEN** 系统 SHALL 从 `tauri-plugin-keyring` 获取主密钥
- **AND** 系统 SHALL 使用 Web Crypto API 和主密钥对 apiKey 字段值进行 AES-256-GCM 加密
- **AND** 系统 SHALL 生成随机 nonce（12 bytes）用于每次加密
- **AND** 系统 SHALL 使用 `bytesToBase64` 工具函数进行 base64 编码
- **AND** 系统 SHALL 将加密结果（ciphertext + auth tag）与 nonce 一起编码
- **AND** 系统 SHALL 在编码后的字符串前添加 "enc:" 前缀
- **AND** 系统 SHALL 将带有前缀的加密字符串存入 JSON 文件

### Requirement: 敏感字段解密读取
当从 JSON 文件读取数据时，系统 SHALL 识别带有 "enc:" 前缀的字段值，使用从 `tauri-plugin-keyring` 获取的主密钥，并通过 Web Crypto API 进行解密还原为原始明文值。base64 解码 SHALL 统一使用 `base64ToBytes` 工具函数（来自 `@/utils/crypto`）。

#### Scenario: 加载包含加密 API 密钥的模型配置
- **WHEN** 应用加载模型配置数据
- **AND** 字段值以 "enc:" 开头
- **THEN** 系统 SHALL 从 `tauri-plugin-keyring` 获取主密钥
- **AND** 系统 SHALL 使用 `base64ToBytes` 工具函数进行 base64 解码
- **AND** 系统 SHALL 提取 nonce（前 12 bytes）和密文（剩余部分）
- **AND** 系统 SHALL 使用 Web Crypto API 和主密钥进行 AES-256-GCM 解密
- **AND** 系统 SHALL 将解密后的明文值加载到内存中
