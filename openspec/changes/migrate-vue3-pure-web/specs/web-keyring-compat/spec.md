# Spec Delta

## MODIFIED Requirements

### Requirement: 主密钥存储支持

系统 SHALL 特别支持主密钥的安全存储，这是 Keyring 平台层的主要用例。

#### Scenario: 首次启动初始化主密钥（完整流程）

- **GIVEN** 应用首次在 Web 环境中启动
- **WHEN** 应用初始化主密钥存储
- **THEN** 系统 SHALL 按以下顺序执行：
  1. 生成 256-bit 随机种子并存储到 `localStorage`（存储键：`multi-chat-keyring-seed`）
  2. 使用种子作为基础密钥材料，通过 PBKDF2 派生加密密钥
  3. 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 主密钥
  4. 使用派生的加密密钥对主密钥进行 AES-256-GCM 加密（生成随机 IV）
  5. 将加密后的主密钥、IV、时间戳存储到 IndexedDB 的 `keys` 对象存储
  6. 显示安全性警告："Web 版本的安全存储基于浏览器本地加密，安全级别有限，请勿在共享设备上处理高敏感数据"

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

系统 SHALL 确保 Web 端的密钥存储满足与其形态相称的安全性要求（浏览器本地加密存储级别）。

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

- **GIVEN** Web 环境无法使用操作系统级密钥链存储密钥
- **WHEN** 设计加密密钥的持久化方案
- **THEN** 系统 SHALL 采用"种子明文存储 + PBKDF2 派生"的方案
- **AND** 安全性分析：
  - **攻击向量**: 攻击者需要同时获取 `localStorage`（种子）+ IndexedDB（加密主密钥）
  - **保护层**: PBKDF2 100,000 次迭代增加暴力破解难度
  - **安全级别**: ⚠️ 浏览器本地加密存储级别，高于完全不加密，但低于操作系统级密钥链
  - **稳定性**: 不依赖 `navigator.userAgent`，跨浏览器版本数据可访问
- **AND** 这是 Web 环境下安全性、可用性和稳定性的合理权衡

#### Scenario: 安全性警告

- **WHEN** 用户在 Web 环境中使用应用
- **THEN** 系统 SHALL 在首次使用时显示安全性提示
- **AND** 提示内容："Web 版本的安全存储基于浏览器本地加密，安全级别有限，请勿在共享设备上处理高敏感数据"
- **AND** 用户可以选择"不再提示"

### Requirement: 模块化设计

Keyring 平台层 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织

- **WHEN** 实现 Keyring 平台层
- **THEN** 系统 SHALL 在既有平台层目录的 `keyring.ts` 模块中实现（目录如重命名则跟随新路径）
- **AND** 模块仅负责密钥存储的平台逻辑
- **AND** 在平台层统一入口中导出 Keyring API

#### Scenario: 类型定义

- **WHEN** 定义 Keyring 平台层类型
- **THEN** 系统 SHALL 以自有类型声明承载公开 API 类型
- **AND** 不再依赖桌面壳 keyring 插件的官方类型定义
- **AND** 提供完整的 TypeScript 类型提示

## ADDED Requirements

### Requirement: 密钥存储平台层

系统 SHALL 以受约束的 `keyring` 实例形式提供密钥存储平台层 API，仅在 Web 环境中可用。

#### Scenario: Web 环境使用 IndexedDB 实现

- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统使用 IndexedDB 实现加密存储
- **AND** 不抛出运行时错误
- **AND** API 签名与迁移前保持一致

#### Scenario: API 稳定性

- **WHEN** 使用 `keyring` 实例的 Keyring API
- **THEN** 函数签名和行为与迁移前保持一致
- **AND** 调用方无需修改代码

#### Scenario: 通过 barrel export 访问

- **WHEN** 开发者使用 `import { keyring } from '@/utils/tauriCompat'`（或其重命名后的等价路径）
- **THEN** 系统 SHALL 提供 `KeyringPublicAPI` 类型的 `keyring` 实例
- **AND** 不导出独立的 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 函数

### Requirement: Keyring 功能可用性标记

密钥存储平台层 SHALL 提供 `isSupported()` 方法，让调用者能够判断 Keyring 功能是否可用。

#### Scenario: Web 环境 Keyring 可用

- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 平台层的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB + 加密）

#### Scenario: Web 环境 Keyring 不可用

- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器不支持 IndexedDB 或 Web Crypto API
- **WHEN** 调用 Keyring 平台层的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Keyring 功能不可用

## REMOVED Requirements

### Requirement: Keyring 插件兼容层

**Reason**: 该需求的目标是"为 `@tauri-plugin-keyring-api` 提供双端兼容层"，且包含"Tauri 环境使用原生实现"场景；桌面壳终止后双端兼容目标失效。其 Web 端行为由新需求「密钥存储平台层」承载。

**Migration**: 调用方继续通过平台层统一入口导入 `keyring` 实例，函数签名不变，无需修改代码。

### Requirement: 功能可用性标记

**Reason**: 原需求包含"Tauri 环境 Keyring 可用"场景，双端语义随桌面壳终止失效；Web 端语义由新需求「Keyring 功能可用性标记」承载。

**Migration**: `isSupported()` 方法保留，调用方无需修改。
