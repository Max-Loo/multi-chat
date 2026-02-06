# Keyring 插件 Web 兼容层规范

本规范定义了 `@tauri-plugin-keyring-api` 插件在 Web 环境中的降级和兼容层要求。

## ADDED Requirements

### Requirement: Keyring 插件兼容层

系统 SHALL 为 `@tauri-plugin-keyring-api` 提供统一的兼容层 API，在 Tauri 和 Web 环境中均可用。

#### Scenario: Tauri 环境使用原生实现
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用兼容层 Keyring API（如 `setPassword()`、`getPassword()`、`deletePassword()`）
- **THEN** 系统调用 `@tauri-plugin-keyring-api` 的原生实现
- **AND** 密钥存储到系统级安全存储（macOS Keychain、Windows DPAPI、Linux Secret Service）

#### Scenario: Web 环境使用 IndexedDB 实现
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用兼容层 Keyring API（如 `setPassword()`、`getPassword()`、`deletePassword()`）
- **THEN** 系统使用 IndexedDB 实现加密存储
- **AND** 不抛出运行时错误
- **AND** 返回类型与 Tauri 环境保持一致

#### Scenario: API 一致性
- **WHEN** 使用兼容层 Keyring API
- **THEN** 函数签名和行为与 `@tauri-plugin-keyring-api` 的原生 API 保持一致
- **AND** 调用者无需修改代码即可在不同环境中运行

### Requirement: IndexedDB 加密存储

在 Web 环境中，系统 SHALL 使用 IndexedDB + AES-256-GCM 加密提供安全的密钥存储功能。

#### Scenario: 创建 IndexedDB 加密数据库
- **WHEN** 应用在 Web 环境中首次访问 Keyring
- **THEN** 系统 SHALL 创建名为 `multi-chat-keyring` 的 IndexedDB 数据库
- **AND** 创建 `keys` 对象存储（Object Store）
- **AND** 使用复合主键：`service` + `user`

#### Scenario: 密码加密存储
- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `setPassword(service, user, password)` 方法
- **THEN** 系统 SHALL 使用 AES-256-GCM 算法加密密码
- **AND** 加密密钥从派生密钥生成（见 Requirement: 加密密钥派生）
- **AND** 系统 SHALL 将加密后的密文存储到 IndexedDB
- **AND** 存储格式为：
  ```typescript
  {
    service: string,
    user: string,
    encryptedPassword: string, // base64 编码的密文
    iv: string, // base64 编码的初始化向量
    createdAt: number // 时间戳
  }
  ```

#### Scenario: 密码解密读取
- **GIVEN** IndexedDB 中已存储加密密码
- **WHEN** 调用 `getPassword(service, user)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 读取加密记录
- **AND** 使用相同的加密密钥和 IV 解密密文
- **AND** 返回解密后的明文密码
- **AND** 如果记录不存在，返回 `null`

#### Scenario: 密码删除
- **GIVEN** IndexedDB 中存在密码记录
- **WHEN** 调用 `deletePassword(service, user)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中删除该记录
- **AND** 后续读取返回 `null`

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
  - 基础密钥材料：`navigator.userAgent` + 存储在 `localStorage` 中的种子（base64 字符串拼接）
  - 盐值（salt）：种子本身（base64 字符串）
  - 迭代次数：100,000 次
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
  2. 使用 `navigator.userAgent` + 种子作为基础密钥材料，通过 PBKDF2 派生加密密钥
  3. 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 主密钥
  4. 使用派生的加密密钥对主密钥进行 AES-256-GCM 加密（生成随机 IV）
  5. 将加密后的主密钥、IV、时间戳存储到 IndexedDB 的 `keys` 对象存储
  6. 显示安全性警告："Web 版本的安全存储级别低于桌面版，建议在桌面版中处理敏感数据"

#### Scenario: 存储主密钥（非首次启动）
- **GIVEN** 应用非首次启动，种子和加密密钥已存在
- **WHEN** 调用 `setPassword("com.multichat.app", "master-key", masterKey)`
- **THEN** 系统 SHALL 使用已派生的加密密钥加密主密钥
- **AND** 系统 SHALL 将加密后的主密钥存储到 IndexedDB
- **AND** 主密钥 SHALL 使用最强的加密保护（AES-256-GCM）

#### Scenario: 读取主密钥（每次启动流程）
- **GIVEN** IndexedDB 中已存储加密的主密钥
- **WHEN** 应用启动并调用 `getPassword("com.multichat.app", "master-key")`
- **THEN** 系统 SHALL 按以下顺序执行：
  1. 从 `localStorage` 读取种子（存储键：`multi-chat-keyring-seed`）
  2. 使用 `navigator.userAgent` + 种子作为基础密钥材料，通过 PBKDF2 重新派生加密密钥
  3. 从 IndexedDB 的 `keys` 对象存储读取加密的主密钥记录
  4. 使用派生的加密密钥和存储的 IV 对主密钥进行 AES-256-GCM 解密
  5. 返回解密后的主密钥明文
- **AND** 应用 SHALL 使用主密钥进行数据加密/解密操作

#### Scenario: 主密钥不存在
- **GIVEN** 应用首次启动或主密钥已删除
- **WHEN** 调用 `getPassword("com.multichat.app", "master-key")`
- **THEN** 系统 SHALL 返回 `null`
- **AND** 应用 SHALL 生成新的主密钥并存储

### Requirement: 加密性能

系统 SHALL 确保 Web 端的加密操作满足性能要求，不影响用户体验。

#### Scenario: 加密性能
- **WHEN** 执行密码加密操作（AES-256-GCM）
- **THEN** 加密操作 SHALL 在 50ms 内完成（Chrome 浏览器基准）
- **AND** 不阻塞 UI 线程

#### Scenario: 解密性能
- **WHEN** 执行密码解密操作
- **THEN** 解密操作 SHALL 在 50ms 内完成
- **AND** 不阻塞 UI 线程

#### Scenario: 密钥派生性能
- **WHEN** 执行密钥派生操作（PBKDF2，100,000 次迭代）
- **THEN** 密钥派生 SHALL 在 500ms 内完成
- **AND** 仅在应用启动时执行一次

### Requirement: 错误处理

系统 SHALL 提供健壮的错误处理机制，确保加密/解密失败时的优雅降级。

#### Scenario: 加密失败
- **WHEN** 加密操作失败（如 Web Crypto API 不可用）
- **THEN** 系统 SHALL 抛出友好的错误提示
- **AND** 错误消息包含"加密失败，请使用现代浏览器"的说明
- **AND** 应用 SHALL 显示用户友好的错误界面

#### Scenario: 解密失败
- **WHEN** 解密操作失败（如密文被篡改）
- **THEN** 系统 SHALL 抛出错误并记录日志
- **AND** 应用 SHALL 显示错误提示"数据解密失败，可能已损坏"

#### Scenario: IndexedDB 不可用
- **GIVEN** 用户的浏览器不支持 IndexedDB
- **WHEN** 尝试访问 Keyring
- **THEN** 系统 SHALL 抛出友好的错误提示
- **AND** 错误消息包含"浏览器不支持安全存储"的说明
- **AND** 应用 SHALL 显示用户友好的错误界面

### Requirement: 功能可用性标记

兼容层 SHALL 提供 `isSupported()` 方法，让调用者能够判断 Keyring 功能是否可用。

#### Scenario: Tauri 环境 Keyring 可用
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用 Keyring 兼容层的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能完全可用

#### Scenario: Web 环境 Keyring 可用
- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 兼容层的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB + 加密）

#### Scenario: Web 环境 Keyring 不可用
- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器不支持 IndexedDB 或 Web Crypto API
- **WHEN** 调用 Keyring 兼容层的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Keyring 功能不可用

### Requirement: 安全性考虑

系统 SHALL 确保 Web 端的密钥存储满足安全性要求，尽管无法达到系统钥匙串的安全级别。

#### Scenario: 加密强度
- **WHEN** 使用 AES-256-GCM 加密算法
- **THEN** 系统 SHALL 使用 256 位密钥
- **AND** 每次加密使用唯一的 IV（初始化向量）
- **AND** IV 长度为 12 字节（GCM 推荐）

#### Scenario: 密钥派生安全性
- **WHEN** 使用 PBKDF2 派生密钥
- **THEN** 系统 SHALL 使用高迭代次数（100,000+）增加暴力破解难度
- **AND** 使用存储在 `localStorage` 中的种子作为盐值
- **AND** 结果密钥长度为 256 位

#### Scenario: 种子明文存储的安全性权衡
- **GIVEN** Web 环境无法像 Tauri 端使用系统钥匙串存储密钥
- **WHEN** 设计加密密钥的持久化方案
- **THEN** 系统 SHALL 采用"种子明文存储 + PBKDF2 派生"的方案
- **AND** 安全性分析：
  - **攻击向量**: 攻击者需要同时获取 `localStorage`（种子）+ IndexedDB（加密主密钥）
  - **保护层**: PBKDF2 100,000 次迭代增加暴力破解难度
  - **安全级别**: ⚠️ 低于 Tauri 端的系统钥匙串，但高于完全不加密
  - **风险评估**: 种子可被浏览器插件或 XSS 攻击读取，但仍需破解 AES-256-GCM 加密的主密钥
- **AND** 这是 Web 环境下安全性与可用性的合理权衡

#### Scenario: 安全性警告
- **WHEN** 用户在 Web 环境中使用应用
- **THEN** 系统 SHALL 在首次使用时显示安全性提示
- **AND** 提示内容："Web 版本的安全存储级别低于桌面版，建议在桌面版中处理敏感数据"
- **AND** 用户可以选择"不再提示"

### Requirement: 浏览器兼容性

系统 SHALL 确保兼容层在支持 Web Crypto API 的主流浏览器中正常工作。

#### Scenario: Chrome/Edge 支持
- **GIVEN** 用户使用 Chrome 或 Edge 浏览器
- **WHEN** 访问应用并使用 Keyring 功能
- **THEN** 所有 Keyring API 正常工作
- **AND** 加密/解密性能良好

#### Scenario: Firefox 支持
- **GIVEN** 用户使用 Firefox 浏览器
- **WHEN** 访问应用并使用 Keyring 功能
- **THEN** 所有 Keyring API 正常工作
- **AND** 加密/解密性能良好

#### Scenario: Safari 支持
- **GIVEN** 用户使用 Safari 浏览器
- **WHEN** 访问应用并使用 Keyring 功能
- **THEN** 所有 Keyring API 正常工作
- **AND** 注意 Safari 的 Web Crypto API 实现

#### Scenario: 旧版浏览器不支持
- **GIVEN** 用户使用不支持 Web Crypto API 的旧版浏览器
- **WHEN** 访问应用
- **THEN** 系统 SHALL 显示错误提示"浏览器版本过低，请升级到最新版本"
- **AND** `isSupported()` 返回 `false`

### Requirement: 模块化设计

Keyring 兼容层 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织
- **WHEN** 实现 Keyring 兼容层
- **THEN** 系统 SHALL 在 `src/utils/tauriCompat/keyring.ts` 中创建独立模块
- **AND** 模块仅负责 Keyring 插件的兼容逻辑
- **AND** 在 `src/utils/tauriCompat/index.ts` 中导出 Keyring API

#### Scenario: 类型定义
- **WHEN** 定义 Keyring 兼容层类型
- **THEN** 系统 SHALL 复用 `@tauri-plugin-keyring-api` 的官方类型定义
- **AND** 不创建重复的类型声明
- **AND** 提供完整的 TypeScript 类型提示
