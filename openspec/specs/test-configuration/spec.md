# test-configuration Spec

## Purpose

配置 Vitest 测试框架与项目 Vite 构建系统的集成，包括测试环境设置、文件匹配模式、覆盖率配置和测试脚本，确保测试框架无缝融入现有开发工作流。

## Requirements

### Requirement: 集成 Vite 配置
系统 SHALL 在 `vite.config.ts` 中添加 `test` 配置块，复用现有 Vite 配置（路径别名、插件等）。

#### Scenario: 读取 Vite 配置
- **WHEN** Vitest 启动时读取配置
- **THEN** 系统从 `vite.config.ts` 导入 `test` 配置块

#### Scenario: 复用路径别名
- **WHEN** 测试代码使用 `@/` 别名导入模块
- **THEN** 系统正确解析为 `src/` 目录

### Requirement: 配置测试环境
系统 SHALL 使用 happy-dom 作为测试环境，提供轻量级 DOM 模拟。

#### Scenario: 初始化测试环境
- **WHEN** 测试文件执行时
- **THEN** 系统使用 happy-dom 创建全局 `window`、`document` 等对象

### Requirement: 配置测试文件匹配模式
系统 SHALL 支持匹配 `src/__test__/` 目录下的 `*.test.ts`、`*.test.tsx`、`*.spec.ts`、`*.spec.tsx` 文件。

#### Scenario: 发现测试文件
- **WHEN** 开发者运行测试命令
- **THEN** 系统自动扫描 `src/__test__/` 目录并匹配符合模式的文件

### Requirement: 配置覆盖率报告
系统 SHALL 配置覆盖率工具收集 `src/` 目录的代码覆盖率，排除 `src/__test__/` 和 `src/__mock__/` 目录。

#### Scenario: 生成覆盖率报告
- **WHEN** 测试启用覆盖率选项
- **THEN** 系统仅统计 `src/` 目录中实际业务代码的覆盖率

### Requirement: 配置 Mock 文件路径
系统 SHALL 将 `src/__mock__/` 目录添加到模块解析路径，支持在测试中导入 mock 数据。

#### Scenario: 导入 Mock 数据
- **WHEN** 测试代码从 `@/mock/xxx` 导入数据
- **THEN** 系统正确解析为 `src/__mock__/xxx` 文件

### Requirement: 添加测试脚本
系统 SHALL 在 `package.json` 中添加测试相关脚本，提供便捷的测试运行方式。

#### Scenario: 运行所有测试
- **WHEN** 开发者执行 `pnpm test`
- **THEN** 系统运行所有测试文件并以监听模式启动

#### Scenario: 运行单次测试
- **WHEN** 开发者执行 `pnpm test:run`
- **THEN** 系统运行所有测试文件并退出

#### Scenario: 启动测试 UI
- **WHEN** 开发者执行 `pnpm test:ui`
- **THEN** 系统启动 Vitest UI 界面

#### Scenario: 生成覆盖率报告
- **WHEN** 开发者执行 `pnpm test:coverage`
- **THEN** 系统运行测试并生成覆盖率报告
