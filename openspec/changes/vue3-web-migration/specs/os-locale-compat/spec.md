# Spec Delta

## ADDED Requirements

### Requirement: locale() 浏览器语言检测

系统 SHALL 提供 `locale()` 函数，返回浏览器语言设置，作为界面语言检测来源。

#### Scenario: Web 环境使用浏览器实现

- **WHEN** 调用 `locale()` 函数
- **THEN** 系统返回 `navigator.language` 的值
- **AND** 返回浏览器语言设置（如 "zh-CN"、"en-US"）

#### Scenario: 返回值格式一致性

- **WHEN** 调用 `locale()` 函数
- **THEN** 返回值格式为 BCP 47 语言标签（language-script-region）

### Requirement: 类型定义自维护

兼容层 SHALL 在 TypeScript 编译时保持类型安全，类型定义由项目自行维护。

#### Scenario: 编译时类型检查

- **GIVEN** 项目使用 TypeScript 严格模式
- **WHEN** 导入和使用 `locale()` 函数
- **THEN** TypeScript 编译器不报类型错误
- **AND** 返回类型为 `string`
- **AND** 不依赖 `@tauri-apps/plugin-os` 的类型声明

### Requirement: Web 测试验证

系统 SHALL 验证语言与平台检测的正确性。

#### Scenario: Web 环境验证

- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 执行功能测试
- **THEN** 验证 `locale()` 不抛出运行时错误
- **AND** `locale()` 返回浏览器语言
- **AND** 应用初始化语言正确

#### Scenario: Safari 平台检测验证

- **GIVEN** 应用运行在 macOS Safari 浏览器
- **WHEN** 测试中文输入法场景
- **THEN** 验证平台检测逻辑正确识别 macOS Safari
- **AND** 中文输入法 bug 处理逻辑正常工作

#### Scenario: 构建流程验证

- **WHEN** 执行 `pnpm dev` 与 `pnpm build`
- **THEN** 构建流程成功
- **AND** 不出现 TypeScript 类型错误
- **AND** 不出现运行时错误

## MODIFIED Requirements

### Requirement: 浏览器语言检测

系统 SHALL 使用浏览器原生 API 获取语言设置。

#### Scenario: 使用 navigator.language

- **WHEN** 调用 `locale()` 函数
- **THEN** 系统返回 `navigator.language` 的值
- **AND** 该值反映浏览器的首选语言设置

#### Scenario: 浏览器语言与系统语言差异

- **GIVEN** 用户浏览器语言与操作系统语言不同
- **WHEN** 调用 `locale()` 函数
- **THEN** 系统返回浏览器语言（非系统语言）
- **AND** 用户可通过应用设置手动调整语言（localStorage 优先级更高）

### Requirement: 导入路径规范

项目代码 SHALL 使用运行时模块的统一导入路径。

#### Scenario: 正确的 locale() 导入

- **WHEN** 在项目代码中需要获取界面语言
- **THEN** 使用 `import { locale } from '@/utils/webRuntime'`
- **AND** 不存在任何 `@tauri-apps/plugin-os` 导入

#### Scenario: 导入路径别名

- **WHEN** 配置 TypeScript 路径别名
- **THEN** `@/` 别名指向 `src/` 目录
- **AND** 运行时模块路径为 `@/utils/webRuntime`

### Requirement: 模块化设计

运行时模块 SHALL 使用模块化设计，便于维护和扩展。

#### Scenario: 目录结构

- **WHEN** 组织语言与平台检测代码
- **THEN** 系统在 `src/utils/webRuntime/` 目录下维护 `os.ts` 文件
- **AND** 在 `src/utils/webRuntime/index.ts` 中导出 `locale()` 函数

#### Scenario: 单一职责原则

- **WHEN** 实现语言与平台检测模块
- **THEN** `os.ts` 只包含语言与平台检测逻辑
- **AND** 不包含其他功能的代码

#### Scenario: 可扩展性

- **WHEN** 未来需要新增浏览器环境检测能力
- **THEN** 系统在 `os.ts` 中添加新函数
- **AND** 保持与 `locale()` 相同的设计模式

### Requirement: 代码规范

运行时模块代码 SHALL 遵循项目的代码规范和最佳实践。

#### Scenario: 中文注释

- **WHEN** 编写运行时模块代码
- **THEN** 所有函数、变量使用中文注释
- **AND** JSDoc 注释使用中文描述

#### Scenario: 无额外依赖

- **WHEN** 实现语言与平台检测模块
- **THEN** 不引入新的 npm 运行时依赖
- **AND** 仅使用浏览器原生 API

#### Scenario: KISS 和 DRY 原则

- **WHEN** 实现运行时模块
- **THEN** 代码保持简洁，避免不必要的抽象
- **AND** 复用共享模块中的公共函数

### Requirement: 文档更新

系统 SHALL 更新项目文档，说明界面语言检测的浏览器实现。

#### Scenario: AGENTS.md 更新

- **WHEN** 完成迁移后
- **THEN** AGENTS.md 中原"OS 插件兼容层"相关章节 SHALL 改写为浏览器语言与平台检测说明
- **AND** 包含以下内容：
  - locale() 的用途和实现方式
  - 如何在代码中使用该 API
  - 浏览器语言作为界面语言来源的行为说明
  - 平台检测逻辑说明

#### Scenario: 导入路径规范说明

- **WHEN** 文档提及语言检测模块
- **THEN** 明确说明使用 `@/utils/webRuntime` 导入
- **AND** 提供代码示例

## REMOVED Requirements

### Requirement: locale() 兼容层
**Reason**: 原含"Tauri 环境使用原生实现"场景且 API 目标为兼容 `@tauri-apps/plugin-os`；Tauri 移除后仅保留浏览器实现，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持函数名与返回值格式不变。

### Requirement: 类型安全
**Reason**: 原要求"复用 @tauri-apps/plugin-os 官方类型定义"；Tauri 依赖移除后类型改由项目自维护，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持 `locale(): string` 签名不变。

### Requirement: 环境检测
**Reason**: 纯 Web 运行时不再存在 Tauri 桌面环境，基于 `isTauri()` 的实现选择逻辑被移除。
**Migration**: `locale()` 无条件使用 `navigator.language` 实现。

### Requirement: 向后兼容性
**Reason**: 项目移除 Tauri 桌面端，无需保持与 `@tauri-apps/plugin-os` 原生 API 的向后兼容。
**Migration**: 无迁移路径；桌面能力随本变更终止。

### Requirement: 测试验证
**Reason**: 原含"Tauri 环境验证"场景且构建流程验证依赖 `pnpm tauri dev`；Tauri 移除后以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 仅保留 Web 环境验证与 Vite 构建验证。
