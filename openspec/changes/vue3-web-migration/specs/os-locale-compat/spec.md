# 语言检测能力规范（增量）

## ADDED Requirements

### Requirement: 语言检测实现

系统 SHALL 提供 `locale()` 函数返回用户语言设置，基于 `navigator.language` 实现，作为应用唯一的语言检测实现。

#### Scenario: Web 环境使用浏览器实现

- **GIVEN** 应用运行在浏览器环境
- **WHEN** 调用 `locale()` 函数
- **THEN** 系统返回 `navigator.language` 的值
- **AND** 返回浏览器语言设置（如 "zh-CN"、"en-US"）

#### Scenario: 返回值格式一致性

- **WHEN** 调用 `locale()` 函数
- **THEN** 返回值格式为 BCP 47 语言标签（language-script-region）

### Requirement: 语言检测测试验证

系统 SHALL 验证语言检测能力的正确性。

#### Scenario: Web 环境验证

- **WHEN** 执行功能测试
- **THEN** `locale()` 返回 `navigator.language` 的值
- **AND** 应用初始化语言正确
- **AND** 应用正常加载和运行

#### Scenario: Safari 平台检测验证

- **GIVEN** 应用运行在 macOS Safari 浏览器
- **WHEN** 测试中文输入法场景
- **THEN** 验证平台检测逻辑正确识别 macOS Safari
- **AND** 中文输入法 bug 处理逻辑正常工作

#### Scenario: 构建流程验证

- **WHEN** 执行 `pnpm dev` 和 `pnpm build`
- **THEN** 两种流程均成功
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

### Requirement: 类型安全

语言检测模块 SHALL 在 TypeScript 编译时保持类型安全。

#### Scenario: 编译时类型检查

- **GIVEN** 项目使用 TypeScript 严格模式
- **WHEN** 导入和使用 `locale()` 函数
- **THEN** TypeScript 编译器不报类型错误
- **AND** 返回类型为 `string`
- **AND** 提供完整的类型提示和自动补全

#### Scenario: 类型定义复用

- **WHEN** 定义语言检测相关类型
- **THEN** 系统 SHALL 保持迁移前对外暴露的公开类型不变
- **AND** 不创建重复的类型声明

### Requirement: 导入路径规范

项目代码 SHALL 使用平台层的统一导入路径，而非直接导入任何平台特定包。

#### Scenario: 正确的 locale() 导入

- **WHEN** 在项目代码中需要获取用户语言
- **THEN** 使用 `import { locale } from '@/utils/platform'`

#### Scenario: 导入路径别名

- **WHEN** 配置 TypeScript 路径别名
- **THEN** `@/` 别名指向 `src/` 目录
- **AND** 平台层路径为 `@/utils/platform`

### Requirement: 模块化设计

语言检测能力 SHALL 遵循项目的模块化设计原则。

#### Scenario: 目录结构

- **WHEN** 实现语言检测能力
- **THEN** 系统 SHALL 在 `src/utils/platform/locale.ts` 中创建独立模块
- **AND** 在 `src/utils/platform/index.ts` 中导出 `locale()` 函数

#### Scenario: 单一职责原则

- **WHEN** 实现语言检测模块
- **THEN** 模块只包含语言检测逻辑
- **AND** 不包含其他平台能力的代码

#### Scenario: 可扩展性

- **WHEN** 未来需要添加其他环境信息能力（如浏览器版本、平台信息）
- **THEN** 系统在平台层添加新模块
- **AND** 保持与 `locale()` 相同的设计模式

### Requirement: 代码规范

语言检测模块 SHALL 遵循项目的代码规范和最佳实践。

#### Scenario: 中文注释

- **WHEN** 编写平台层代码
- **THEN** 所有函数、变量使用中文注释
- **AND** JSDoc 注释使用中文描述

#### Scenario: 无额外依赖

- **WHEN** 实现语言检测能力
- **THEN** 不引入新的 npm 运行时依赖
- **AND** 仅使用浏览器原生 API

#### Scenario: KISS 和 DRY 原则

- **WHEN** 实现平台层模块
- **THEN** 代码保持简洁，避免不必要的抽象
- **AND** 消除重复代码，提取公共逻辑到独立函数

### Requirement: 文档更新

系统 SHALL 更新项目文档，说明语言检测的 Web 实现方式。

#### Scenario: AGENTS.md 更新

- **WHEN** 完成平台层迁移后
- **THEN** AGENTS.md 中的平台层说明与 `src/utils/platform/` 的实际结构保持一致
- **AND** 包含语言检测的实现方式与导入示例

#### Scenario: 导入路径规范说明

- **WHEN** 文档提及平台层
- **THEN** 明确说明使用 `@/utils/platform` 导入
- **AND** 提供代码示例

## REMOVED Requirements

### Requirement: locale() 兼容层

**Reason**: 原需求以"Tauri 与 Web 双环境"为前提（含"Tauri 环境使用原生实现"场景）；桌面端移除后该前提消失。

**Migration**: 由新需求"语言检测实现"承接：`locale()` 函数保留，唯一实现为 `navigator.language`，返回格式（BCP 47）不变。

### Requirement: 测试验证

**Reason**: 原需求包含"Tauri 环境验证"场景，随桌面端移除失效。

**Migration**: 由新需求"语言检测测试验证"承接浏览器环境功能测试、Safari 平台检测与构建流程验证。

### Requirement: 环境检测

**Reason**: `isTauri()` 双环境检测随 Tauri 移除而删除，`locale()` 不再按环境选择实现。

**Migration**: `locale()` 唯一实现为 `navigator.language`（见"语言检测实现"）；平台探测的总体约束由 `web-only-platform` 的"环境检测收缩"承接。

### Requirement: 向后兼容性

**Reason**: "保持 Tauri 桌面功能向后兼容"的前提随桌面端移除而消失。

**Migration**: 无；桌面端功能为本变更的既定 BREAKING 移除范围。
