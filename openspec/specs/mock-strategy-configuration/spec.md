# mock-strategy-configuration Spec

## Purpose

提供 Mock 配置管理系统，定义全局默认 Mock 策略、按测试套件覆盖策略、Mock 生命周期管理（创建、重置、清理），确保 Mock 配置的集中管理和一致性。

## ADDED Requirements

### Requirement: 全局 Mock 配置入口

系统 SHALL 提供 `setupGlobalMocks()` 函数，在 `setup.ts` 中调用，用于初始化全局默认 Mock 配置。

#### Scenario: 初始化全局 Mock

- **WHEN** 在 `setup.ts` 中调用 `setupGlobalMocks()`
- **THEN** 系统自动配置默认的 Tauri API Mock
- **AND** 系统不阻塞后续测试执行

#### Scenario: 全局 Mock 配置持久化

- **WHEN** 多个测试文件执行
- **THEN** 系统保持全局 Mock 配置的一致性

---

### Requirement: 默认 Mock 策略定义

系统 SHALL 定义明确的默认 Mock 策略，指定哪些模块默认 Mock，哪些按需 Mock。

#### Scenario: 默认 Mock 策略

- **WHEN** 测试未显式配置 Mock
- **THEN** 系统对 `shell`、`os`、`http`、`store` 模块使用默认 Mock
- **AND** 系统对 `keyring` 模块保持真实实现（除非显式 Mock）

---

### Requirement: 测试套件级别覆盖

系统 SHALL 支持在 `describe` 块级别覆盖全局 Mock 配置。

#### Scenario: 覆盖全局 Mock

- **WHEN** 在 `beforeEach` 中调用 `createTauriMocks({ isTauri: false })`
- **THEN** 该测试套件内使用覆盖后的配置
- **AND** 不影响其他测试套件

---

### Requirement: 单个测试级别覆盖

系统 SHALL 支持在单个 `it` 块级别覆盖 Mock 配置。

#### Scenario: 单测试覆盖

- **WHEN** 在单个测试中调用 `mockGetPassword.mockResolvedValue('custom')`
- **THEN** 仅该测试使用覆盖后的返回值
- **AND** 后续测试恢复默认配置

---

### Requirement: Mock 配置优先级

系统 SHALL 按以下优先级应用 Mock 配置：单测试覆盖 > 测试套件覆盖 > 全局默认。

#### Scenario: 配置优先级验证

- **WHEN** 全局配置 `isTauri: true`，测试套件配置 `isTauri: false`，单测试配置 `isTauri: true`
- **THEN** 系统在单测试中使用 `isTauri: true`
- **AND** 系统在测试套件其他测试中使用 `isTauri: false`

---

### Requirement: Mock 生命周期钩子

系统 SHALL 提供标准的生命周期钩子函数，用于在测试前后执行 Mock 操作。

#### Scenario: beforeEach 钩子

- **WHEN** 在 `beforeEach` 中配置 Mock
- **THEN** 系统在每个测试执行前重置 Mock 状态

#### Scenario: afterEach 钩子

- **WHEN** 在 `afterEach` 中调用 `resetAllMocks()`
- **THEN** 系统在每个测试执行后清理 Mock 调用记录

---

### Requirement: 配置文档和类型提示

系统 SHALL 为所有 Mock 配置选项提供 TypeScript 类型定义和 JSDoc 文档。

#### Scenario: TypeScript 类型支持

- **WHEN** 开发者在 IDE 中使用 Mock 工厂函数
- **THEN** 系统提供完整的类型提示和参数说明

#### Scenario: 配置错误提示

- **WHEN** 开发者传入无效的配置选项
- **THEN** 系统 TypeScript 编译时报错

---

### Requirement: Tauri 环境检测配置

测试环境 SHALL 正确检测和模拟 Tauri 环境。

#### Scenario: Tauri 环境标识

- **WHEN** 测试代码检查 window.__TAURI__
- **THEN** Mock 提供正确的 Tauri 环境标识

#### Scenario: Tauri API Mock 可用性

- **WHEN** 测试代码调用 Tauri API（如 invoke）
- **THEN** Mock 函数返回预期的测试数据

#### Scenario: Web 环境模拟

- **WHEN** 需要测试 Web 降级逻辑
- **THEN** 可以切换到 Web 环境 Mock

#### Scenario: 环境切换隔离

- **WHEN** 不同测试用例需要不同环境
- **THEN** 每个测试用例的环境独立，互不干扰

---

### Requirement: 加密 API Mock 配置

测试环境 SHALL 提供 Web Crypto API 的 Mock 实现。

#### Scenario: crypto.subtle 可用

- **WHEN** 测试代码使用 crypto.subtle
- **THEN** 提供符合规范的 Mock 实现

#### Scenario: AES-GCM 加密/解密

- **WHEN** 使用 AES-GCM 算法加密数据
- **THEN** Mock 返回可预测的加密结果用于测试

#### Scenario: PBKDF2 密钥派生

- **WHEN** 使用 PBKDF2 从密码派生密钥
- **THEN** Mock 返回固定的测试密钥

#### Scenario: 随机数生成

- **WHEN** 代码生成随机 IV 或盐值
- **THEN** Mock 返回固定的测试值以确保可重复性

#### Scenario: 加密错误模拟

- **WHEN** 需要测试加密失败场景
- **THEN** Mock 可以抛出预期的错误

---

### Requirement: IndexedDB Mock 配置

测试环境 SHALL 提供 IndexedDB 的 Mock 实现。

#### Scenario: IDBDatabase 创建

- **WHEN** 代码打开 IndexedDB 数据库
- **THEN** Mock 返回模拟的 IDBDatabase 实例

#### Scenario: ObjectStore 操作

- **WHEN** 代码在 object store 中存储数据
- **THEN** Mock 模拟存储操作并可以验证存储的数据

#### Scenario: 事务管理

- **WHEN** 代码使用 IDBTransaction
- **THEN** Mock 正确模拟事务生命周期

#### Scenario: 查询操作

- **WHEN** 代码从 IndexedDB 读取数据
- **THEN** Mock 返回预设的测试数据

#### Scenario: 数据库版本升级

- **WHEN** 代码执行数据库迁移
- **THEN** Mock 支持模拟版本升级流程

---

### Requirement: LocalStorage Mock 配置

测试环境 SHALL 提供 localStorage 的隔离 Mock。

#### Scenario: 数据存储

- **WHEN** 代码调用 localStorage.setItem
- **THEN** 数据存储在测试专用的内存存储中

#### Scenario: 数据读取

- **WHEN** 代码调用 localStorage.getItem
- **THEN** 返回之前存储的测试数据

#### Scenario: 数据清除

- **WHEN** 调用 localStorage.clear
- **THEN** 只清除当前测试的数据，不影响其他测试

#### Scenario: 测试间隔离

- **WHEN** 一个测试修改了 localStorage
- **THEN** 其他测试看不到这个修改

---

### Requirement: Fetch API Mock 配置

测试环境 SHALL 提供 fetch 的 Mock 实现。

#### Scenario: HTTP 请求拦截

- **WHEN** 代码发起 fetch 请求
- **THEN** Mock 拦截并返回预设的响应

#### Scenario: 响应头设置

- **WHEN** 需要模拟特定的响应头
- **THEN** Mock 支持设置自定义响应头

#### Scenario: 状态码模拟

- **WHEN** 需要测试不同的 HTTP 状态码
- **THEN** Mock 可以返回任意状态码

#### Scenario: 网络错误模拟

- **WHEN** 需要测试网络失败场景
- **THEN** Mock 可以抛出网络错误

#### Scenario: 超时模拟

- **WHEN** 需要测试超时处理
- **THEN** Mock 支持延迟响应或超时错误

---

### Requirement: Vercel AI SDK Mock 配置

测试环境 SHALL 提供 Vercel AI SDK 专用 Mock。

#### Scenario: streamText Mock 结构

- **WHEN** 代码调用 streamText
- **THEN** Mock 返回包含 fullStream 和元数据 Promise 的对象

#### Scenario: 异步生成器模拟

- **WHEN** 代码遍历 fullStream
- **THEN** Mock 生成器按顺序 yield 预设的事件

#### Scenario: 元数据 Promise 模拟

- **WHEN** 代码 await streamText 结果
- **THEN** Mock 返回包含所有元数据字段的对象

#### Scenario: 生成器错误模拟

- **WHEN** 需要测试生成器抛出错误
- **THEN** Mock 生成器可以抛出预期的错误

#### Scenario: SDK 版本兼容性

- **WHEN** SDK 版本升级
- **THEN** Mock 实现同步更新以匹配新 API

---

### Requirement: 供应商 SDK Mock 配置

测试环境 SHALL 提供各供应商 SDK 的 Mock。

#### Scenario: DeepSeek SDK Mock

- **WHEN** 代码调用 createDeepSeek
- **THEN** Mock 返回可以创建语言模型的 provider 函数

#### Scenario: MoonshotAI SDK Mock

- **WHEN** 代码调用 createMoonshotAI
- **THEN** Mock 返回可以创建语言模型的 provider 函数

#### Scenario: Zhipu SDK Mock

- **WHEN** 代码调用 createZhipu
- **THEN** Mock 返回可以创建语言模型的 provider 函数

#### Scenario: Provider 实例模拟

- **WHEN** 使用 provider 创建模型实例
- **THEN** Mock 返回符合 LanguageModel 接口的对象

#### Scenario: SDK 配置传递

- **WHEN** 创建 provider 时传入 apiKey 和 baseURL
- **THEN** Mock 验证配置参数正确传递

---

### Requirement: 测试辅助工具

测试环境 SHALL 提供便捷的测试辅助函数。

#### Scenario: Mock 数据工厂

- **WHEN** 测试需要创建复杂的数据对象
- **THEN** 提供工厂函数快速创建测试数据

#### Scenario: 测试数据隔离

- **WHEN** 多个测试使用相同工厂函数
- **THEN** 每个测试获得独立的数据副本

#### Scenario: 断言辅助

- **WHEN** 需要验证加密或特殊格式的数据
- **THEN** 提供自定义断言如 toBeEncrypted

#### Scenario: 性能测量

- **WHEN** 需要测量操作执行时间
- **THEN** 提供 measurePerformance 辅助函数

#### Scenario: 异步测试支持

- **WHEN** 测试异步生成器或 Promise
- **THEN** 提供工具函数简化异步断言
