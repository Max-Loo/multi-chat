# Store Web 能力规范（增量）

## ADDED Requirements

### Requirement: Store Web 实现

系统 SHALL 以键值存储 API 的形式提供数据持久化能力（保留既有对外 API 形态：`get()`、`set()`、`save()`、`delete()`、`keys()`），基于 IndexedDB 实现，作为应用唯一的键值持久化实现。

#### Scenario: Web 环境使用 IndexedDB 实现

- **GIVEN** 应用运行在浏览器环境
- **WHEN** 调用键值存储 API（如 `get()`、`set()`、`save()`）
- **THEN** 系统使用 IndexedDB 实现数据持久化
- **AND** 不抛出运行时错误

#### Scenario: API 一致性

- **WHEN** 使用键值存储 API
- **THEN** 函数签名与迁移前对外暴露的 API 形态保持一致
- **AND** 调用方代码无需因平台层重构而修改

### Requirement: Store 可用性检测

键值存储能力 SHALL 提供 `isSupported()` 方法，让调用者能够判断当前浏览器是否支持该功能。

#### Scenario: Web 环境 Store 可用

- **GIVEN** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能可用（使用 IndexedDB）

#### Scenario: Web 环境 Store 不可用

- **GIVEN** 浏览器不支持 IndexedDB（如隐私模式或旧版浏览器）
- **WHEN** 调用 Store 的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Store 功能不可用

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
- **WHEN** 调用 `get(key)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中读取对应键的值
- **AND** 返回值支持字符串、对象、数组等 JSON 可序列化类型
- **AND** 如果键不存在，返回 `null`

#### Scenario: 写入键值

- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `set(key, value)` 方法
- **THEN** 系统 SHALL 将键值对写入 IndexedDB
- **AND** 支持的值类型包括：字符串、数字、布尔值、对象、数组
- **AND** 数据在写入后立即可读（同事务内）

#### Scenario: 删除键值

- **GIVEN** IndexedDB 数据库中存在键 `myKey`
- **WHEN** 调用 `delete(key)` 方法
- **THEN** 系统 SHALL 从 IndexedDB 中删除该键
- **AND** 后续读取该键返回 `null`

#### Scenario: 保存持久化

- **GIVEN** IndexedDB 数据库已创建
- **WHEN** 调用 `save()` 方法
- **THEN** 系统 SHALL 确保所有未提交的写入操作完成
- **AND** IndexedDB 自动持久化，该方法对调用方保持可用
- **AND** 方法始终返回成功的 Promise

#### Scenario: 列出所有键

- **GIVEN** IndexedDB 数据库中存在多个键
- **WHEN** 调用 `keys()` 方法
- **THEN** 系统 SHALL 返回所有键的数组
- **AND** 返回类型为 `string[]`

### Requirement: 数据类型兼容性

系统 SHALL 保证键值存储对常用数据类型的序列化和反序列化正确性。

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
- **AND** 显示错误提示"浏览器存储空间不足，请清理数据"
- **AND** 应用 SHALL 优雅降级，不崩溃

#### Scenario: 事务失败处理

- **WHEN** IndexedDB 事务失败（如数据库版本冲突）
- **THEN** 系统 SHALL 记录错误日志
- **AND** 返回包含错误信息的 Promise rejection
- **AND** 调用者可以通过 catch 捕获错误

### Requirement: 数据迁移

系统 SHALL 提供键值数据的导出与导入能力，满足用户备份与换机迁移需求。

#### Scenario: 手动数据导入导出

- **WHEN** 用户需要备份数据或迁移到新的浏览器环境
- **THEN** 系统 SHALL 提供数据导出功能（导出为 JSON 文件）
- **AND** 系统 SHALL 提供数据导入功能（从 JSON 文件导入到 IndexedDB）

### Requirement: Web Store 使用共享的 initIndexedDB

Store 的 IndexedDB 初始化 SHALL 使用从平台层共享模块导入的 `initIndexedDB` 函数，而非本地定义的版本。

#### Scenario: Store 功能不变

- **WHEN** 通过 Store API 进行 get/set/delete/keys 操作
- **THEN** 行为与重构前完全一致，数据格式不变

#### Scenario: 公开 API 不变

- **WHEN** 上层代码通过 `@/utils/platform` 导入 store 相关 API
- **THEN** 所有导出的函数签名和类型保持不变

### Requirement: 模块化设计

Store 能力 SHALL 遵循项目的模块化设计原则。

#### Scenario: 文件组织

- **WHEN** 实现 Store 能力
- **THEN** 系统 SHALL 在 `src/utils/platform/store.ts` 中创建独立模块
- **AND** 模块仅负责键值持久化逻辑
- **AND** 在 `src/utils/platform/index.ts` 中导出 Store API

#### Scenario: 类型定义

- **WHEN** 定义 Store 相关类型
- **THEN** 系统 SHALL 保持迁移前对外暴露的公开类型不变
- **AND** 不创建重复的类型声明
- **AND** 提供完整的 TypeScript 类型提示

## REMOVED Requirements

### Requirement: Store 插件兼容层

**Reason**: 原需求以"Tauri 与 Web 双环境"为前提（"在 Tauri 和 Web 环境中均可用"及"Tauri 环境使用原生实现"场景）；桌面端移除后该前提消失。

**Migration**: 由新需求"Store Web 实现"承接：键值存储 API 签名、IndexedDB 实现全部保留，数据格式不变，无调用方改动。

### Requirement: 功能可用性标记

**Reason**: 原需求包含"Tauri 环境 Store 可用"场景，随桌面端移除失效。

**Migration**: 由新需求"Store 可用性检测"承接：`isSupported()` 方法保留，仅按浏览器能力（IndexedDB）判定可用性。
