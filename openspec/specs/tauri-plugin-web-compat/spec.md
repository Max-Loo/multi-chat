# Tauri 插件 Web 兼容层规范

本规范定义了 Tauri 插件在 Web 环境中的降级和兼容层要求。

## ADDED Requirements

### Requirement: 环境检测

系统 SHALL 提供运行时环境检测功能，以判断当前是否运行在 Tauri 桌面环境中。

#### Scenario: Tauri 环境检测
- **GIVEN** 应用运行在 Tauri 桌面环境（通过 `pnpm dev` 或 `pnpm build` 启动）
- **WHEN** 调用 `isTauri()` 函数
- **THEN** 函数返回 `true`

#### Scenario: Web 环境检测
- **GIVEN** 应用运行在 Web 浏览器环境（通过 `pnpm web:dev` 或 `pnpm web:build` 启动）
- **WHEN** 调用 `isTauri()` 函数
- **THEN** 函数返回 `false`

#### Scenario: 实现方式
- **WHEN** 实现 `isTauri()` 函数
- **THEN** 系统通过检测 `window.__TAURI__` 对象的存在性来判断环境
- **AND** 不依赖编译时环境变量或 UserAgent 检测

### Requirement: Shell 插件兼容层

系统 SHALL 为 `@tauri-apps/plugin-shell` 提供统一的兼容层 API，在 Tauri 和 Web 环境中均可用。

#### Scenario: Tauri 环境使用原生实现
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用兼容层 API（如 `Command.create()`）
- **THEN** 系统调用 `@tauri-apps/plugin-shell` 的原生实现
- **AND** 返回实际的 Shell 执行结果

#### Scenario: Web 环境使用降级实现
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用兼容层 API（如 `Command.create()`）
- **THEN** 系统返回 Null Object 实现
- **AND** 不抛出运行时错误
- **AND** 返回类型与 Tauri 环境保持一致

#### Scenario: API 一致性
- **WHEN** 使用兼容层 API
- **THEN** 函数签名和行为与 `@tauri-apps/plugin-shell` 的原生 API 保持一致
- **AND** 调用者无需修改代码即可在不同环境中运行

### Requirement: 类型安全

兼容层 SHALL 在 TypeScript 编译时保持类型安全，确保两种环境下的类型定义一致。

#### Scenario: 编译时类型检查
- **GIVEN** 项目使用 TypeScript 严格模式
- **WHEN** 导入和使用兼容层 API
- **THEN** TypeScript 编译器不报类型错误
- **AND** 提供完整的类型提示和自动补全

#### Scenario: 类型定义复用
- **WHEN** 定义兼容层类型
- **THEN** 系统复用 `@tauri-apps/plugin-shell` 的官方类型定义
- **AND** 不创建重复的类型声明
- **AND** 类型定义包含必要的扩展（如 `isSupported()` 方法）

### Requirement: 功能降级行为
在 Web 环境中，系统 SHALL 根据插件的特性选择合适的降级实现策略（Null Object 模式或 IndexedDB 替代方案），确保应用不会因插件缺失而崩溃。

#### Scenario: Command.execute 降级
- **GIVEN** 应用运行在 Web 环境
- **WHEN** 调用 `Command.execute()` 方法
- **THEN** 方法返回成功的 Promise，模拟执行成功
- **AND** 返回值包含默认的成功状态（如 `code: 0`）
- **AND** 不实际执行任何 Shell 命令

#### Scenario: shell.open 降级
- **GIVEN** 应用运行在 Web 环境
- **WHEN** 调用 `shell.open()` 方法打开 URL
- **THEN** 方法使用浏览器原生 `window.open()` API 打开 URL
- **AND** 方法返回成功的 Promise
- **AND** 仅支持 URL，不支持本地文件路径

#### Scenario: Store 插件降级
- **GIVEN** 应用运行在 Web 环境
- **WHEN** 调用 Store 插件 API（如 `Store.get()`、`Store.set()`）
- **THEN** 方法使用 IndexedDB 实现数据持久化
- **AND** API 行为与 Tauri 原生实现保持一致
- **AND** 方法始终返回成功的 Promise

#### Scenario: Keyring 插件降级
- **GIVEN** 应用运行在 Web 环境
- **WHEN** 调用 Keyring 插件 API（如 `setPassword()`、`getPassword()`）
- **THEN** 方法使用 IndexedDB + AES-256-GCM 加密实现安全存储
- **AND** API 行为与 Tauri 原生实现保持一致
- **AND** 方法始终返回成功的 Promise

#### Scenario: 不抛出异常
- **GIVEN** 应用运行在 Web 环境
- **WHEN** 调用任何兼容层 API
- **THEN** 方法永不抛出运行时错误
- **AND** 始终返回 resolved Promise

### Requirement: 功能可用性标记

兼容层 API SHALL 提供 `isSupported()` 方法，让调用者能够判断当前功能是否真正可用。

#### Scenario: Tauri 环境功能可用
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用兼容层 API 的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示功能完全可用

#### Scenario: Web 环境 Command 功能不可用
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `Command` 对象的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示 Shell 命令执行功能已降级，不提供实际行为

#### Scenario: Web 环境 shell.open 功能可用
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `shell` 对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示 URL 打开功能可用（使用浏览器原生 API）

#### Scenario: Web 环境 Store 功能可用
- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器支持 IndexedDB
- **WHEN** 调用 Store 对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示键值存储功能可用（使用 IndexedDB）

#### Scenario: Web 环境 Store 功能不可用
- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器不支持 IndexedDB
- **WHEN** 调用 Store 对象的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示键值存储功能不可用

#### Scenario: Web 环境 Keyring 功能可用
- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器支持 IndexedDB 和 Web Crypto API
- **WHEN** 调用 Keyring 对象的 `isSupported()` 方法
- **THEN** 方法返回 `true`
- **AND** 表示安全密钥存储功能可用（使用 IndexedDB + 加密）

#### Scenario: Web 环境 Keyring 功能不可用
- **GIVEN** 应用运行在 Web 浏览器环境
- **AND** 浏览器不支持 IndexedDB 或 Web Crypto API
- **WHEN** 调用 Keyring 对象的 `isSupported()` 方法
- **THEN** 方法返回 `false`
- **AND** 表示安全密钥存储功能不可用

#### Scenario: UI 层响应功能可用性
- **WHEN** UI 组件调用 `isSupported()` 返回 `false`
- **THEN** UI 层 SHOULD 禁用相关功能按钮或显示功能不可用提示
- **AND** 不向用户暴露降级行为的实现细节

### Requirement: 模块化设计
兼容层 SHALL 使用模块化设计，遵循 SOLID 原则，便于扩展和维护。

#### Scenario: 目录结构
- **WHEN** 创建兼容层代码
- **THEN** 系统在 `src/utils/tauriCompat/` 目录下组织代码
- **AND** 包含以下文件：
  - `index.ts`: 导出所有兼容层 API
  - `env.ts`: 环境检测工具函数
  - `shell.ts`: Shell 插件兼容层实现
  - `os.ts`: OS 插件兼容层实现
  - `store.ts`: Store 插件兼容层实现
  - `keyring.ts`: Keyring 插件兼容层实现

#### Scenario: 单一职责原则
- **WHEN** 实现兼容层模块
- **THEN** 每个文件只负责一个明确的职责
- **AND** `env.ts` 只包含环境检测逻辑
- **AND** `shell.ts` 只包含 Shell 插件兼容逻辑
- **AND** `os.ts` 只包含 OS 插件兼容逻辑
- **AND** `store.ts` 只包含 Store 插件兼容逻辑
- **AND** `keyring.ts` 只包含 Keyring 插件兼容逻辑

#### Scenario: 可扩展性
- **WHEN** 需要为其他 Tauri 插件添加兼容层
- **THEN** 系统使用与 Shell 和 OS 插件相同的模式
- **AND** 在 `src/utils/tauriCompat/` 下添加新的模块文件（如 `keyring.ts`、`store.ts`）
- **AND** 在 `index.ts` 中导出新模块的 API

### Requirement: 导入路径规范

项目代码 SHALL 使用 `@/` 别名导入兼容层模块，而非相对路径。

#### Scenario: 正确的导入方式
- **WHEN** 在项目代码中导入兼容层 API
- **THEN** 使用 `import { isTauri, Command } from '@/utils/tauriCompat'`
- **AND** 不使用相对路径如 `import { Command } from '../../../utils/tauriCompat'`

### Requirement: 向后兼容性

兼容层 SHALL 保持完全向后兼容，不破坏现有的 Tauri 桌面功能。

#### Scenario: 现有代码不受影响
- **GIVEN** 代码库中已有直接使用 `@tauri-apps/plugin-shell` 的代码
- **WHEN** 引入兼容层
- **THEN** 现有代码继续正常工作
- **AND** 不需要立即修改现有代码
- **AND** 可以逐步迁移到兼容层 API

#### Scenario: Tauri 环境性能
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 通过兼容层调用 Shell API
- **THEN** 性能与直接使用原生 API 相当
- **AND** 兼容层引入的性能开销可忽略不计

### Requirement: 代码规范

兼容层代码 SHALL 遵循项目的代码规范和最佳实践。

#### Scenario: 中文注释
- **WHEN** 编写兼容层代码
- **THEN** 所有函数、类、变量使用中文注释
- **AND** JSDoc 注释使用中文描述

#### Scenario: 无额外依赖
- **WHEN** 实现兼容层
- **THEN** 不引入新的 npm 运行时依赖
- **AND** 仅使用项目已有的依赖（如 `@tauri-apps/plugin-shell`）

#### Scenario: KISS 和 DRY 原则
- **WHEN** 实现兼容层
- **THEN** 代码保持简洁，避免不必要的抽象
- **AND** 消除重复代码，提取公共逻辑到独立函数

### Requirement: 文档更新
系统 SHALL 更新项目文档，说明 Tauri 插件的 Web 兼容模式。

#### Scenario: AGENTS.md 更新
- **WHEN** 实现兼容层后
- **THEN** 在 AGENTS.md 中新增章节说明跨平台兼容性模式
- **AND** 包含以下内容：
  - 兼容层的用途和设计原理
  - 如何在代码中使用兼容层 API
  - 哪些功能在 Web 端不可用
  - 如何为其他插件添加兼容层
  - Store 和 Keyring 插件的兼容层实现细节
  - IndexedDB 降级方案的说明

#### Scenario: 导入路径规范说明
- **WHEN** 文档提及兼容层
- **THEN** 明确说明使用 `@/` 别名导入
- **AND** 提供代码示例

### Requirement: 测试验证

系统 SHALL 在两种环境中验证兼容层的正确性。

#### Scenario: Tauri 环境验证
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 执行集成测试
- **THEN** 验证兼容层调用原生 API 成功
- **AND** Shell 功能正常工作
- **AND** `isSupported()` 返回 `true`

#### Scenario: Web 环境验证
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 执行集成测试
- **THEN** 验证兼容层不抛出运行时错误
- **AND** 应用正常加载和运行
- **AND** `isSupported()` 返回 `false`

#### Scenario: 构建流程验证
- **WHEN** 执行 `pnpm dev` 和 `pnpm web:dev`
- **THEN** 两种构建流程均成功
- **AND** 不出现 TypeScript 类型错误
- **AND** 不出现运行时错误

### Requirement: IndexedDB 降级策略
对于需要数据持久化的 Tauri 插件（如 store、keyring），系统 SHALL 使用 IndexedDB 作为 Web 环境的降级方案，而非 Null Object 模式。

#### Scenario: 选择降级策略
- **WHEN** 为新的 Tauri 插件实现兼容层
- **THEN** 系统 SHALL 根据插件特性选择降级策略：
  - 如果插件涉及数据持久化（如 store、keyring），使用 IndexedDB 替代方案
  - 如果插件涉及系统操作（如 shell 命令），使用 Null Object 模式
- **AND** 降级策略 SHALL 在兼容层文档中明确说明

#### Scenario: IndexedDB 数据库隔离
- **WHEN** 使用 IndexedDB 降级方案
- **THEN** 每个插件 SHALL 使用独立的 IndexedDB 数据库
- **AND** 数据库名称格式：`multi-chat-<plugin-name>`（如 `multi-chat-store`、`multi-chat-keyring`）
- **AND** 不同插件的数据 SHALL 互不干扰

### Requirement: 降级策略一致性
兼容层 SHALL 确保 Web 端的降级实现与 Tauri 端的原生 API 在行为上保持一致，包括数据类型、错误处理和性能特征。

#### Scenario: Store API 一致性
- **WHEN** 使用 Store 兼容层 API
- **THEN** Web 端和 Tauri 端的 API 签名完全一致
- **AND** 支持的数据类型完全一致（字符串、对象、数组等）
- **AND** 错误处理行为一致

#### Scenario: Keyring API 一致性
- **WHEN** 使用 Keyring 兼容层 API
- **THEN** Web 端和 Tauri 端的 API 签名完全一致
- **AND** 密码存储和读取行为一致
- **AND** 错误处理行为一致
