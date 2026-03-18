# Delta Spec: Web Keyring Compat

本文件定义了对 `web-keyring-compat` 能力的修改。

## MODIFIED Requirements

### Requirement: 加密密钥派生

系统 SHALL 使用 Web Crypto API 从持久化的种子值派生加密密钥，确保每次启动都能派生出相同的密钥。

#### Scenario: 种子生成与存储（首次启动）
- **WHEN** 应用首次在 Web 环境中初始化 Keyring
- **THEN** 系统 SHALL 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 随机种子
- **AND** 系统 SHALL 将种子转换为 base64 编码的字符串
- **AND** 系统 SHALL 将种子以明文形式存储到浏览器的 `localStorage` 中
  - 存储键：`multi-chat-keyring-seed`
  - 存储值：base64 编码的种子字符串
- **AND** 后续每次启动时从 `localStorage` 读取相同的种子

#### Scenario: 加密密钥派生
- **WHEN** 应用在 Web 环境中初始化 Keyring（首次或后续启动）
- **THEN** 系统 SHALL 使用 PBKDF2 算法派生加密密钥
- **AND** 派生参数：
  - 基础密钥材料：存储在 `localStorage` 中的种子（base64 字符串）
  - 盐值（salt）：种子本身（base64 字符串）
  - 迭代次数：100,000 次（测试环境 1,000 次）
  - 哈希算法：SHA-256
  - 输出密钥长度：256 bits（AES-256-GCM 密钥）
- **AND** 派生密钥 SHALL 存储在内存中（不持久化）
- **AND** 每次应用启动时使用相同的种子和参数重新派生相同密钥

#### Scenario: 密钥安全性
- **WHEN** 使用派生密钥加密数据
- **THEN** 系统 SHALL 确保派生密钥不以明文形式暴露在日志或内存转储中
- **AND** 派生密钥 SHALL 存储在闭包或私有变量中（仅存在于内存）
- **AND** 派生密钥 SHALL 不在 IndexedDB 或 `localStorage` 中持久化
- **AND** 种子以明文形式存储在 `localStorage` 中（已知的安全权衡）

#### Scenario: 种子丢失处理
- **GIVEN** 应用非首次启动
- **WHEN** `localStorage` 中不存在种子（可能因用户清除浏览器数据）
- **THEN** 系统 SHALL 视为首次启动
- **AND** 系统 SHALL 生成新的种子并存储到 `localStorage`
- **AND** 系统 SHALL 派生新的加密密钥
- **AND** 应用 SHALL 显示警告"旧加密数据将无法解密"

### Requirement: 主密钥存储支持

系统 SHALL 特别支持主密钥的安全存储，这是 Keyring 兼容层的主要用例。

#### Scenario: 首次启动初始化主密钥（完整流程）
- **GIVEN** 应用首次在 Web 环境中启动
- **WHEN** 应用初始化主密钥存储
- **THEN** 系统 SHALL 按以下顺序执行：
  1. 生成 256-bit 随机种子并存储到 `localStorage`（存储键：`multi-chat-keyring-seed`）
  2. 使用种子作为基础密钥材料，通过 PBKDF2 派生加密密钥
  3. 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 主密钥
  4. 使用派生的加密密钥对主密钥进行 AES-256-GCM 加密（生成随机 IV）
  5. 将加密后的主密钥、IV、时间戳存储到 IndexedDB 的 `keys` 对象存储
  6. 显示安全性警告："Web 版本的安全存储级别低于桌面版，建议在桌面版中处理敏感数据"

#### Scenario: 读取主密钥（每次启动流程）
- **GIVEN** IndexedDB 中已存储加密的主密钥
- **WHEN** 应用启动并调用 `getPassword("com.multichat.app", "master-key")`
- **THEN** 系统 SHALL 按以下顺序执行：
  1. 从 `localStorage` 读取种子（存储键：`multi-chat-keyring-seed`）
  2. 使用种子作为基础密钥材料，通过 PBKDF2 重新派生加密密钥
  3. 从 IndexedDB 的 `keys` 对象存储读取加密的主密钥记录
  4. 使用派生的加密密钥和存储的 IV 对主密钥进行 AES-256-GCM 解密
  5. 返回解密后的主密钥明文
- **AND** 应用 SHALL 使用主密钥进行数据加密/解密操作

### Requirement: 密钥派生安全性

系统 SHALL 确保密钥派生满足安全性要求。

#### Scenario: 密钥派生安全性
- **WHEN** 使用 PBKDF2 派生密钥
- **THEN** 系统 SHALL 使用高迭代次数（100,000+）增加暴力破解难度
- **AND** 使用存储在 `localStorage` 中的种子作为盐值
- **AND** 结果密钥长度为 256 位
- **AND** 密钥派生不依赖 `navigator.userAgent` 或其他易变的浏览器属性

#### Scenario: 种子明文存储的安全性权衡
- **GIVEN** Web 环境无法像 Tauri 端使用系统钥匙串存储密钥
- **WHEN** 设计加密密钥的持久化方案
- **THEN** 系统 SHALL 采用"种子明文存储 + PBKDF2 派生"的方案
- **AND** 安全性分析：
  - **攻击向量**: 攻击者需要同时获取 `localStorage`（种子）+ IndexedDB（加密主密钥）
  - **保护层**: PBKDF2 100,000 次迭代增加暴力破解难度
  - **安全级别**: ⚠️ 低于 Tauri 端的系统钥匙串，但高于完全不加密
  - **稳定性**: 不依赖 `navigator.userAgent`，跨浏览器版本数据可访问
- **AND** 这是 Web 环境下安全性、可用性和稳定性的合理权衡
