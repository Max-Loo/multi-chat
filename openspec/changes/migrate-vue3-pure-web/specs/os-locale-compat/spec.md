# Spec Delta

## MODIFIED Requirements

### Requirement: locale() 兼容层

系统 SHALL 提供 `locale()` 函数，基于 `navigator.language` 返回浏览器语言设置。

#### Scenario: 返回浏览器语言

- **WHEN** 调用 `locale()` 函数
- **THEN** 系统返回 `navigator.language` 的值
- **AND** 返回浏览器语言设置（如 "zh-CN"、"en-US"）

#### Scenario: 返回值格式一致性

- **WHEN** 调用 `locale()` 函数
- **THEN** 返回值格式为 BCP 47 语言标签（language-script-region）

### Requirement: 类型安全

平台层 SHALL 在 TypeScript 编译时保持类型安全。

#### Scenario: 编译时类型检查

- **GIVEN** 项目使用 TypeScript 严格模式
- **WHEN** 导入和使用 `locale()` 函数
- **THEN** TypeScript 编译器不报类型错误
- **AND** 返回类型为 `string`

#### Scenario: 类型定义

- **WHEN** 定义平台层类型
- **THEN** 系统使用原生 TypeScript 类型定义
- **AND** 不创建与已移除 OS 插件对齐的类型声明

### Requirement: 导入路径规范

项目代码 SHALL 使用平台层的统一导入路径。

#### Scenario: 正确的 locale() 导入

- **WHEN** 在项目代码中需要获取浏览器语言
- **THEN** 使用 `import { locale } from '@/utils/platform'`
- **AND** 不直接依赖任何桌面端 OS 插件

#### Scenario: 导入路径别名

- **WHEN** 配置 TypeScript 路径别名
- **THEN** `@/` 别名指向 `src/` 目录
- **AND** 平台层路径为 `@/utils/platform`

### Requirement: 模块化设计

平台层 SHALL 使用模块化设计，便于维护和扩展。

#### Scenario: 目录结构

- **WHEN** 创建语言与平台检测代码
- **THEN** 系统在 `src/utils/platform/` 目录下维护 `os.ts` 文件
- **AND** 在 `src/utils/platform/index.ts` 中导出 `locale()` 函数

#### Scenario: 单一职责原则

- **WHEN** 实现语言与平台检测模块
- **THEN** `os.ts` 只包含浏览器语言与 UserAgent 平台检测逻辑
- **AND** 不包含其他功能的代码

### Requirement: 代码规范

平台层代码 SHALL 遵循项目的代码规范和最佳实践。

#### Scenario: 中文注释

- **WHEN** 编写平台层代码
- **THEN** 所有函数、变量使用中文注释
- **AND** JSDoc 注释使用中文描述

#### Scenario: 无额外依赖

- **WHEN** 实现平台层
- **THEN** 不引入新的 npm 运行时依赖
- **AND** 仅使用浏览器原生 API 与项目已有依赖

#### Scenario: KISS 和 DRY 原则

- **WHEN** 实现平台层
- **THEN** 代码保持简洁，避免不必要的抽象
- **AND** 语言检测与平台检测各自独立、职责单一

### Requirement: 测试验证

系统 SHALL 在浏览器环境中验证语言与平台检测的正确性。

#### Scenario: Web 环境验证

- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 执行功能测试
- **THEN** 验证平台层不抛出运行时错误
- **AND** `locale()` 返回浏览器语言
- **AND** 应用初始化语言正确

#### Scenario: Safari 平台检测验证

- **GIVEN** 应用运行在 macOS Safari 浏览器
- **WHEN** 测试中文输入法场景
- **THEN** 验证 UserAgent 平台检测逻辑正确识别 macOS Safari
- **AND** 中文输入法 bug 处理逻辑正常工作

## REMOVED Requirements

### Requirement: 环境检测

**Reason**: 纯 Web 端不存在 Tauri 桌面运行环境，`isTauri()` 及"按环境选择实现"的分支逻辑移除。
**Migration**: 无需替代——`locale()` 直接读取 `navigator.language`。

### Requirement: 向后兼容性

**Reason**: "Tauri 环境功能不变、返回值与原生 API 一致"的约束随桌面端移除失效。
**Migration**: 无调用方依赖 Tauri 行为；函数签名保持不变。
