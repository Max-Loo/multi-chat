# Spec Delta

## ADDED Requirements

### Requirement: Keyring 安全存储 API
系统 SHALL 提供受约束的 `keyring` 实例 API（`setPassword`/`getPassword`/`deletePassword`），在纯 Web 环境中以 IndexedDB + AES-256-GCM 加密实现，不提供任何桌面系统钥匙串分支。

#### Scenario: 浏览器环境使用 IndexedDB 加密实现
- **GIVEN** 应用运行在浏览器环境
- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统使用 IndexedDB 实现加密存储
- **AND** 不抛出运行时错误

#### Scenario: API 一致性
- **WHEN** 使用 `keyring` 实例的 Keyring API
- **THEN** 函数签名和行为与迁移前的兼容层 API 保持一致
- **AND** 既有调用方无需修改代码

#### Scenario: 通过 barrel export 访问
- **WHEN** 开发者从统一存储模块导入 `keyring`
- **THEN** 系统 SHALL 提供 `KeyringPublicAPI` 类型的 `keyring` 实例
- **AND** 不导出独立的 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 函数

### Requirement: Keyring 功能可用性标记

Keyring 模块 SHALL 提供 `isSupported()` 方法，让调用者能够判断 Keyring 功能是否可用。

#### Scenario: 浏览器支持时可用
- **GIVEN** 应用运行在浏览器环境
- **AND** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB + 加密）

#### Scenario: 浏览器不支持时不可用
- **GIVEN** 应用运行在浏览器环境
- **AND** 浏览器不支持 IndexedDB 或 Web Crypto API
- **WHEN** 调用 Keyring 的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Keyring 功能不可用

## MODIFIED Requirements

### Requirement: 主密钥存储支持

系统 SHALL 特别支持主密钥的安全存储，这是 Keyring 的主要用例。

#### Scenario: 首次启动初始化主密钥（完整流程）
- **GIVEN** 应用首次启动
- **WHEN** 应用初始化主密钥存储
- **THEN** 系统 SHALL 按以下顺序执行：
  1. 生成 256-bit 随机种子并存储到 `localStorage`（存储键：`multi-chat-keyring-seed`）
  2. 使用种子作为基础密钥材料，通过 PBKDF2 派生加密密钥
  3. 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 主密钥
  4. 使用派生的加密密钥对主密钥进行 AES-256-GCM 加密（生成随机 IV）
  5. 将加密后的主密钥、IV、时间戳存储到 IndexedDB 的 `keys` 对象存储
  6. 显示安全性提示，引导用户通过密钥管理页导出主密钥备份（密钥仅存于本浏览器，清除浏览器数据将导致数据无法恢复）

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
  2. 使用种子作为基础密钥材料，通过 PBKDF2 重新派生加密密钥
  3. 从 IndexedDB 的 `keys` 对象存储读取加密的主密钥记录
  4. 使用派生的加密密钥和存储的 IV 对主密钥进行 AES-256-GCM 解密
  5. 返回解密后的主密钥明文
- **AND** 应用 SHALL 使用主密钥进行数据加密/解密操作

#### Scenario: 主密钥不存在
- **GIVEN** 应用首次启动或主密钥已删除
- **WHEN** 调用 `getPassword("com.multichat.app", "master-key")`
- **THEN** 系统 SHALL 返回 `null`
- **AND** 应用 SHALL 生成新的主密钥并存储

### Requirement: 安全性考虑

系统 SHALL 确保 Web 端的密钥存储满足安全性要求。

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
- **AND** 密钥派生不依赖 `navigator.userAgent` 或其他易变的浏览器属性

#### Scenario: 种子明文存储的安全性权衡
- **GIVEN** 纯 Web 环境无系统级安全存储可用
- **WHEN** 设计加密密钥的持久化方案
- **THEN** 系统 SHALL 采用"种子明文存储 + PBKDF2 派生"的方案
- **AND** 安全性分析：
  - **攻击向量**: 攻击者需要同时获取 `localStorage`（种子）+ IndexedDB（加密主密钥）
  - **保护层**: PBKDF2 100,000 次迭代增加暴力破解难度
  - **安全级别**: ⚠️ 高于完全不加密，但属于浏览器环境下的固有上限
  - **稳定性**: 不依赖 `navigator.userAgent`，跨浏览器版本数据可访问
- **AND** 这是纯 Web 环境下安全性、可用性和稳定性的合理权衡

#### Scenario: 安全性警告
- **WHEN** 用户首次使用应用
- **THEN** 系统 SHALL 提示密钥存储于本浏览器本地
- **AND** 引导用户导出主密钥备份以防止浏览器数据清除导致数据不可恢复
- **AND** 用户可以选择"不再提示"

### Requirement: 模块化设计

Keyring 模块 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织
- **WHEN** 实现 Keyring 模块
- **THEN** 系统 SHALL 在纯 Web 存储模块内创建独立模块
- **AND** 模块仅负责密钥存储逻辑
- **AND** 通过统一 barrel export 导出 Keyring API

#### Scenario: 类型定义
- **WHEN** 定义 Keyring API 类型
- **THEN** 系统 SHALL 自行维护 `KeyringPublicAPI` 等 TypeScript 类型定义
- **AND** 类型签名与迁移前调用方使用的签名保持一致
- **AND** 提供完整的 TypeScript 类型提示

## REMOVED Requirements

### Requirement: Keyring 插件兼容层
**Reason**: 该需求的"Tauri 环境使用原生实现"等场景依赖桌面系统钥匙串分支；Tauri 运行时移除后仅存在 Web 实现路径，"插件兼容层"定位不再成立。
**Migration**: 由本文件 ADDED 的"Keyring 安全存储 API"需求取代，API 签名与调用方式不变，仅移除桌面分支场景。

### Requirement: 功能可用性标记
**Reason**: 原需求的"Tauri 环境 Keyring 可用"场景依赖桌面运行时；移除后需以纯浏览器能力重新定义可用性判断。
**Migration**: 由本文件 ADDED 的"Keyring 功能可用性标记"需求取代，判断依据（IndexedDB 与 Web Crypto API 支持）与迁移前 Web 分支一致。
