# Spec Delta

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
  6. 显示安全性提示（见"安全性考虑"需求的修订）

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

系统 SHALL 确保密钥存储方案的安全性边界对用户透明，明确定义浏览器本地加密的攻击向量。

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

- **WHEN** 设计加密密钥的持久化方案
- **THEN** 系统 SHALL 采用"种子明文存储 + PBKDF2 派生"的方案
- **AND** 安全性分析：
  - **攻击向量**: 攻击者需要同时获取 `localStorage`（种子）+ IndexedDB（加密主密钥），即对本机浏览器存储的完全访问权
  - **保护层**: PBKDF2 100,000 次迭代增加暴力破解难度
  - **安全级别**: ⚠️ 高于完全不加密，低于操作系统级钥匙串——这是纯浏览器环境下安全性、可用性和稳定性的合理权衡
  - **稳定性**: 不依赖 `navigator.userAgent`，跨浏览器版本数据可访问

#### Scenario: 安全性警告

- **WHEN** 用户首次使用应用
- **THEN** 系统 SHALL 显示安全性提示，内容说明密钥加密存储于浏览器本地，清除浏览器数据会导致已加密数据无法解密，并建议使用主密钥导出功能备份
- **AND** 用户可以选择"不再提示"（localStorage 标记 `multi-chat-security-warning-dismissed`）

### Requirement: Web Keyring 内部实现使用共享模块

Keyring 的内部实现 SHALL 从共享模块导入 `initIndexedDB`、`encrypt`、`decrypt`、`PasswordRecord`、`isTestEnvironment`、`getPBKDF2Iterations` 及 PBKDF2 常量，而非在本地定义这些函数和常量。

#### Scenario: keyring 功能不变

- **WHEN** 通过 Keyring 进行密钥的 set/get/delete 操作
- **THEN** 行为与重构前完全一致，加密数据格式不变，可正确读写已有数据

#### Scenario: 公开 API 不变

- **WHEN** 上层代码通过 `@/utils/platform` 导入 keyring 相关 API
- **THEN** 所有导出的函数签名和类型保持不变

### Requirement: 模块化设计

Keyring 模块 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织

- **WHEN** 实现 Keyring 模块
- **THEN** 系统 SHALL 在 `src/utils/platform/keyring.ts` 中创建独立模块
- **AND** 模块仅负责密钥加密存储逻辑
- **AND** 在 `src/utils/platform/index.ts` 中导出 Keyring API

#### Scenario: 类型定义

- **WHEN** 定义 Keyring 类型
- **THEN** 系统 SHALL 使用项目自定义类型（如 `PasswordRecord`、`KeyringPublicAPI`）
- **AND** 不创建与已移除 Keyring 插件对齐的类型声明
- **AND** 提供完整的 TypeScript 类型提示

## ADDED Requirements

### Requirement: Keyring 加密存储 API

系统 SHALL 以受约束的 `keyring` 实例形式提供密钥存储 API，基于 IndexedDB + AES-256-GCM 加密实现。

#### Scenario: 加密存储实现

- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统使用 IndexedDB + AES-256-GCM 加密实现密钥存储
- **AND** 不抛出运行时错误

#### Scenario: 通过 barrel export 访问

- **WHEN** 开发者使用 `import { keyring } from '@/utils/platform'`
- **THEN** 系统 SHALL 提供 `KeyringPublicAPI` 类型的 `keyring` 实例
- **AND** 不导出独立的 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 函数

### Requirement: Keyring 功能可用性标记

Keyring SHALL 提供 `isSupported()` 方法，返回浏览器对 IndexedDB 与 Web Crypto API 的支持情况。

#### Scenario: Keyring 可用

- **GIVEN** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB + 加密）

#### Scenario: Keyring 不可用

- **GIVEN** 浏览器不支持 IndexedDB 或 Web Crypto API
- **WHEN** 调用 Keyring 的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Keyring 功能不可用

## REMOVED Requirements

### Requirement: Keyring 插件兼容层

**Reason**: 需求前提（"在 Tauri 和 Web 环境中均可用"、系统级钥匙串场景 macOS Keychain/Windows DPAPI/Linux Secret Service）随桌面端移除失效；保留场景无法覆盖纯 Web 语义。
**Migration**: 由新需求"Keyring 加密存储 API"承接——IndexedDB + AES-256-GCM 加密存储为唯一实现，该实现此前已在线上 Web 版运行，API 签名不变。

### Requirement: 功能可用性标记

**Reason**: 原 3 个场景中"Tauri 环境 Keyring 可用"随桌面端移除失效，需求以纯浏览器能力检测语义重建。
**Migration**: 由新需求"Keyring 功能可用性标记"承接，`isSupported()` 的浏览器能力检测行为与迁移前 Web 环境行为一致。
