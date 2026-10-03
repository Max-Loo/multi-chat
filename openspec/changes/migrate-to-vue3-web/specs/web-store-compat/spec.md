# Spec Delta

## ADDED Requirements

### Requirement: Store 键值存储 API
系统 SHALL 提供统一的 Store API（`get`/`set`/`delete`/`keys`/`save`），在纯 Web 环境中以 IndexedDB 实现数据持久化，不提供桌面文件存储分支。

#### Scenario: 浏览器环境使用 IndexedDB 实现
- **GIVEN** 应用运行在浏览器环境
- **WHEN** 调用 Store API（如 `Store.get()`、`Store.set()`、`Store.save()`）
- **THEN** 系统使用 IndexedDB 实现数据持久化
- **AND** 不抛出运行时错误

#### Scenario: API 一致性
- **WHEN** 使用 Store API
- **THEN** 函数签名和行为与迁移前的兼容层 API 保持一致
- **AND** 既有调用方无需修改代码

### Requirement: Store 功能可用性标记

Store 模块 SHALL 提供 `isSupported()` 方法，让调用者能够判断 Store 功能是否可用。

#### Scenario: 浏览器支持时可用
- **GIVEN** 应用运行在浏览器环境
- **AND** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB）

#### Scenario: 浏览器不支持时不可用
- **GIVEN** 应用运行在浏览器环境
- **AND** 浏览器不支持 IndexedDB（如隐私模式或旧版浏览器）
- **WHEN** 调用 Store 的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Store 功能不可用

### Requirement: 数据备份与恢复

系统 SHALL 支持用户对本地数据的手动导出与导入，作为浏览器数据丢失风险的备份手段。

#### Scenario: 手动数据导出
- **WHEN** 用户需要备份本地数据
- **THEN** 系统 SHALL 提供数据导出功能（导出为 JSON 文件）
- **AND** 导出范围覆盖聊天数据与模型配置

#### Scenario: 手动数据导入
- **WHEN** 用户需要恢复备份
- **THEN** 系统 SHALL 提供数据导入功能（从 JSON 文件导入到 IndexedDB）
- **AND** 导入后的数据可正常读取与解密（配合主密钥导入）

## MODIFIED Requirements

### Requirement: IndexedDB 数据存储

在纯 Web 环境中，系统 SHALL 使用 IndexedDB 提供键值存储功能，确保数据持久化和性能。

#### Scenario: 创建 IndexedDB 数据库
- **WHEN** 应用首次访问 Store
- **THEN** 系统 SHALL 创建名为 `multi-chat-store` 的 IndexedDB 数据库
- **AND** 创建 `store` 对象存储（Object Store）
- **AND** 使用 `key` 字段作为主键

#### Scenario: 读取键值
- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `Store.get(key)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中读取对应键的值
- **AND** 返回值的类型支持字符串、对象、数组等 JSON 可序列化类型
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
- **AND** IndexedDB 自动持久化，此方法为兼容既有调用方的空操作
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
- **AND** 显示错误提示"浏览器存储空间不足，请清理浏览器数据或导出备份"
- **AND** 应用 SHALL 优雅降级，不崩溃

#### Scenario: 事务失败处理
- **WHEN** IndexedDB 事务失败（如数据库版本冲突）
- **THEN** 系统 SHALL 记录错误日志
- **AND** 返回包含错误信息的 Promise rejection
- **AND** 调用者可以通过 catch 捕获错误

### Requirement: 模块化设计

Store 模块 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织
- **WHEN** 实现 Store 模块
- **THEN** 系统 SHALL 在纯 Web 存储模块内创建独立模块
- **AND** 模块仅负责键值存储逻辑
- **AND** 通过统一 barrel export 导出 Store API

#### Scenario: 类型定义
- **WHEN** 定义 Store API 类型
- **THEN** 系统 SHALL 自行维护 `StoreCompat` 等 TypeScript 类型定义
- **AND** 类型签名与迁移前调用方使用的签名保持一致
- **AND** 提供完整的 TypeScript 类型提示

## REMOVED Requirements

### Requirement: Store 插件兼容层
**Reason**: 该需求的"Tauri 环境使用原生实现"等场景依赖桌面 plugin-store 分支；Tauri 运行时移除后仅存在 IndexedDB 实现路径，"插件兼容层"定位不再成立。
**Migration**: 由本文件 ADDED 的"Store 键值存储 API"需求取代，API 签名与调用方式不变，仅移除桌面分支场景。

### Requirement: 功能可用性标记
**Reason**: 原需求的"Tauri 环境 Store 可用"场景依赖桌面运行时；移除后需以纯浏览器能力重新定义可用性判断。
**Migration**: 由本文件 ADDED 的"Store 功能可用性标记"需求取代，判断依据（IndexedDB 支持）与迁移前 Web 分支一致。

### Requirement: 数据迁移
**Reason**: 原需求以"从 Tauri 桌面版向 Web 版迁移数据"为唯一目的；桌面版移除后不存在跨端迁移场景。
**Migration**: 由本文件 ADDED 的"数据备份与恢复"需求承接同一导出/导入能力，目的调整为浏览器数据备份。
