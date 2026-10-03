# Spec Delta

## MODIFIED Requirements

### Requirement: IndexedDB 数据存储

在 Web 环境中，系统 SHALL 使用 IndexedDB 提供键值存储功能，确保数据持久化和性能。

#### Scenario: 创建 IndexedDB 数据库

- **WHEN** 应用在 Web 环境中首次访问 Store
- **THEN** 系统 SHALL 创建名为 `multi-chat-store` 的 IndexedDB 数据库
- **AND** 创建 `store` 对象存储（Object Store）
- **AND** 使用 `key` 字段作为主键

#### Scenario: 读取键值

- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `Store.get(key)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中读取对应键的值
- **AND** 返回值的类型与迁移前保持一致（支持字符串、对象、数组等 JSON 可序列化类型）
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
- **AND** IndexedDB 自动持久化，此方法保持既有兼容语义
- **AND** 方法始终返回成功的 Promise

#### Scenario: 列出所有键

- **GIVEN** IndexedDB 数据库中存在多个键
- **WHEN** 调用 `Store.keys()` 方法
- **THEN** 系统 SHALL 返回所有键的数组
- **AND** 返回类型为 `string[]`

### Requirement: 数据类型兼容性

平台层 SHALL 确保存储数据的类型保真，支持所有常用数据类型的序列化和反序列化。

#### Scenario: 对象存储

- **WHEN** 存储复杂对象（如包含嵌套属性的对象）
- **THEN** 系统 SHALL 正确序列化和反序列化对象
- **AND** 对象结构在读写后保持不变

#### Scenario: 数组存储

- **WHEN** 存储数组（如模型列表）
- **THEN** 系统 SHALL 正确序列化和反序列化数组
- **AND** 数组元素顺序和内容保持不变

#### Scenario: 布尔和数字类型

- **WHEN** 存储布尔值或数字
- **THEN** 系统 SHALL 保持数据类型不变
- **AND** 读取时返回原始类型（不转换为字符串）

### Requirement: 模块化设计

Store 平台层 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织

- **WHEN** 实现 Store 平台层
- **THEN** 系统 SHALL 在既有平台层目录的 `store.ts` 模块中实现（目录如重命名则跟随新路径）
- **AND** 模块仅负责键值存储的平台逻辑
- **AND** 在平台层统一入口中导出 Store API

#### Scenario: 类型定义

- **WHEN** 定义 Store 平台层类型
- **THEN** 系统 SHALL 以自有类型声明承载公开 API 类型
- **AND** 不再依赖桌面壳 Store 插件的官方类型定义
- **AND** 提供完整的 TypeScript 类型提示

## ADDED Requirements

### Requirement: 键值存储平台层

系统 SHALL 提供统一的键值存储平台层 API，仅在 Web 环境中可用，以 IndexedDB 承载数据持久化。

#### Scenario: Web 环境使用 IndexedDB 实现

- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用平台层 Store API（如 `Store.get()`、`Store.set()`、`Store.save()`）
- **THEN** 系统使用 IndexedDB 实现数据持久化
- **AND** 不抛出运行时错误
- **AND** 返回类型与迁移前保持一致

#### Scenario: API 稳定性

- **WHEN** 使用平台层 Store API
- **THEN** 函数签名和行为与迁移前保持一致
- **AND** 调用方无需修改代码

### Requirement: Store 功能可用性标记

键值存储平台层 SHALL 提供 `isSupported()` 方法，让调用者能够判断 Store 功能是否可用。

#### Scenario: Web 环境 Store 可用

- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 平台层的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB）

#### Scenario: Web 环境 Store 不可用

- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器不支持 IndexedDB（如隐私模式或旧版浏览器）
- **WHEN** 调用 Store 平台层的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Store 功能不可用

## REMOVED Requirements

### Requirement: Store 插件兼容层

**Reason**: 该需求的目标是"为 `@tauri-apps/plugin-store` 提供双端兼容层"，且包含"Tauri 环境使用原生实现"场景；桌面壳终止后双端兼容目标失效。其 Web 端行为由新需求「键值存储平台层」承载。

**Migration**: 调用方继续通过平台层统一入口导入 Store API，函数签名不变，无需修改代码。

### Requirement: 功能可用性标记

**Reason**: 原需求包含"Tauri 环境 Store 可用"场景，双端语义随桌面壳终止失效；Web 端语义由新需求「Store 功能可用性标记」承载。

**Migration**: `isSupported()` 方法保留，调用方无需修改。

### Requirement: 数据迁移

**Reason**: 桌面壳终止后不再存在「从桌面端迁移数据到 Web 端」的场景；平台层不再承担跨端数据搬运职责。

**Migration**: 桌面版用户如需保留数据，请在桌面版仍可用时通过应用内既有导出功能（如聊天导出）自行备份；Web 端数据延续现有 IndexedDB/localStorage 体系，不做桌面数据导入通道。
