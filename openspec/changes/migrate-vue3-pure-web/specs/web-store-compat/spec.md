# Spec Delta

## MODIFIED Requirements

### Requirement: IndexedDB 数据存储

系统 SHALL 使用 IndexedDB 提供键值存储功能，确保数据持久化和性能。

#### Scenario: 创建 IndexedDB 数据库

- **WHEN** 应用首次访问 Store
- **THEN** 系统 SHALL 创建名为 `multi-chat-store` 的 IndexedDB 数据库
- **AND** 创建 `store` 对象存储（Object Store）
- **AND** 使用 `key` 字段作为主键

#### Scenario: 读取键值

- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `Store.get(key)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中读取对应键的值
- **AND** 返回值支持字符串、对象、数组等 JSON 可序列化类型
- **AND** 如果键不存在，返回 `null`

#### Scenario: 写入键值

- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `Store.set(key, value)` 方法
- **THEN** 系统 SHALL 将键值对写入 IndexedDB
- **AND** 支持的值类型包括：字符串、数字、布尔值、对象、数组
- **AND** 数据在写入后立即可读（同事务内）

#### Scenario: 删除键值

- **GIVEN** IndexedDB 数据库中存在键 `myKey`
- **WHEN** 调用 `Store.delete(key)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中删除该键
- **AND** 后续读取该键返回 `null`

#### Scenario: 保存持久化

- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `Store.save()` 方法
- **THEN** 系统 SHALL 确保所有未提交的写入操作完成
- **AND** IndexedDB 写入本身即时持久化，此方法为确认性空操作
- **AND** 方法始终返回成功的 Promise

#### Scenario: 列出所有键

- **GIVEN** IndexedDB 数据库中存在多个键
- **WHEN** 调用 `Store.keys()` 方法
- **THEN** 系统 SHALL 返回所有键的数组
- **AND** 返回类型为 `string[]`

### Requirement: 错误处理

系统 SHALL 提供健壮的错误处理机制，确保 IndexedDB 访问失败时的优雅降级。

#### Scenario: IndexedDB 不可用

- **GIVEN** 用户的浏览器不支持 IndexedDB（如隐私模式）
- **WHEN** 尝试访问 Store
- **THEN** 系统 SHALL 抛出友好的错误提示
- **AND** 错误消息包含"浏览器不支持 IndexedDB"的说明
- **AND** 应用 SHALL 显示用户友好的错误界面

#### Scenario: 存储配额超限

- **GIVEN** 用户的浏览器存储空间不足
- **WHEN** 尝试写入大量数据
- **THEN** 系统 SHALL 捕获 `QuotaExceededError` 异常
- **AND** 显示错误提示"浏览器存储空间不足，请清理浏览器数据或删除旧聊天"
- **AND** 应用 SHALL 优雅降级，不崩溃

#### Scenario: 事务失败处理

- **WHEN** IndexedDB 事务失败（如数据库版本冲突）
- **THEN** 系统 SHALL 记录错误日志
- **AND** 返回包含错误信息的 Promise rejection
- **AND** 调用者可以通过 catch 捕获错误

### Requirement: 数据迁移

系统 SHALL 提供基于 JSON 文件的数据导入导出能力，作为用户跨设备迁移数据的通道。

#### Scenario: 手动数据导入导出

- **WHEN** 用户需要将数据迁移到其他浏览器或设备
- **THEN** 系统 SHALL 提供数据导出功能（导出为 JSON 文件）
- **AND** 系统 SHALL 提供数据导入功能（从 JSON 文件导入到 IndexedDB）
- **AND** 桌面版本地文件数据无法被浏览器读取，密钥通过主密钥导出/导入功能迁移

### Requirement: Web Store 使用共享的 initIndexedDB

Store 的 IndexedDB 初始化 SHALL 使用从共享模块导入的 `initIndexedDB` 函数，而非本地定义的版本。

#### Scenario: Store 功能不变

- **WHEN** 通过 Store 进行 get/set/delete/keys 操作
- **THEN** 行为与重构前完全一致，数据格式不变

#### Scenario: 公开 API 不变

- **WHEN** 上层代码通过 `@/utils/platform` 导入 store 相关 API
- **THEN** 所有导出的函数签名和类型保持不变

### Requirement: 模块化设计

Store 模块 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织

- **WHEN** 实现 Store 模块
- **THEN** 系统 SHALL 在 `src/utils/platform/store.ts` 中创建独立模块
- **AND** 模块仅负责键值存储逻辑
- **AND** 在 `src/utils/platform/index.ts` 中导出 Store API

#### Scenario: 类型定义

- **WHEN** 定义 Store 类型
- **THEN** 系统 SHALL 使用项目自定义类型或原生 IndexedDB 类型
- **AND** 不创建与已移除 Store 插件对齐的类型声明
- **AND** 提供完整的 TypeScript 类型提示

## ADDED Requirements

### Requirement: Store 键值存储 API

系统 SHALL 提供统一的 Store API，基于 IndexedDB 实现键值数据持久化。

#### Scenario: 使用 IndexedDB 实现

- **WHEN** 调用 Store API（如 `Store.get()`、`Store.set()`、`Store.save()`）
- **THEN** 系统使用 IndexedDB 实现数据持久化
- **AND** 不抛出运行时错误

#### Scenario: 通过 barrel export 访问

- **WHEN** 上层代码通过 `@/utils/platform` 导入 store 相关 API
- **THEN** 函数签名和类型保持不变
- **AND** 业务调用方无需修改调用方式

### Requirement: Store 功能可用性标记

Store SHALL 提供 `isSupported()` 方法，返回浏览器对 IndexedDB 的支持情况。

#### Scenario: Store 可用

- **GIVEN** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB）

#### Scenario: Store 不可用

- **GIVEN** 浏览器不支持 IndexedDB（如隐私模式或旧版浏览器）
- **WHEN** 调用 Store 的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Store 功能不可用

## REMOVED Requirements

### Requirement: Store 插件兼容层

**Reason**: 需求前提（"为 @tauri-apps/plugin-store 提供兼容层、在 Tauri 和 Web 环境中均可用"）随桌面端移除失效；保留场景无法覆盖纯 Web 语义。
**Migration**: 由新需求"Store 键值存储 API"承接——IndexedDB 为唯一持久化实现，API 签名不变，业务调用方无需修改。

### Requirement: 功能可用性标记

**Reason**: 原 3 个场景中"Tauri 环境 Store 可用"随桌面端移除失效，需求以纯浏览器能力检测语义重建。
**Migration**: 由新需求"Store 功能可用性标记"承接，`isSupported()` 的浏览器能力检测行为与迁移前 Web 环境行为一致。

### Requirement: 数据类型兼容性

**Reason**: 该需求约束"Web 端与 Tauri 端数据类型保持一致"（含"读取时返回 Tauri 端一致类型"的表述）；双端并存前提消失后，IndexedDB 原生结构化克隆语义即为唯一契约。
**Migration**: 对象、数组、布尔、数字的序列化行为由"IndexedDB 数据存储"需求的写入/读取场景继续保证，用户可感知行为不变。
