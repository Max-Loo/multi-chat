# test-configuration Spec

## Purpose

配置 Vitest 测试框架与项目 Vite 构建系统的集成，包括测试环境设置、文件匹配模式、覆盖率配置、测试脚本、统一的 Mock 配置入口和测试辅助工具系统，确保测试框架无缝融入现有开发工作流。

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

### Requirement: 统一 Mock 配置入口

系统 SHALL 在 `setup.ts` 中提供统一的 Mock 配置入口函数，替代分散的 `vi.mock()` 调用。

#### Scenario: 导入全局 Mock 配置
- **WHEN** `setup.ts` 导入 `setupGlobalMocks` 函数并调用
- **THEN** 系统初始化所有默认 Mock 配置
- **AND** 系统 Mock 配置可被测试文件覆盖

#### Scenario: 移除分散的 vi.mock 调用
- **WHEN** 使用新的统一 Mock 系统
- **THEN** 系统从 `setup.ts` 中移除顶层的 `vi.mock('@/utils/tauriCompat/xxx')` 调用
- **AND** 系统将 Mock 配置逻辑迁移到 `helpers/mocks/` 目录

### Requirement: 全局测试辅助工具导入

系统 SHALL 在 `setup.ts` 中自动导入全局测试辅助工具，使其在所有测试中可用。

#### Scenario: 导入自定义断言
- **WHEN** `setup.ts` 导入 `@/test-helpers/assertions`
- **THEN** 系统所有测试文件可直接使用自定义断言函数

#### Scenario: 扩展 Vitest matchers
- **WHEN** `setup.ts` 调用 `expect.extend(customMatchers)`
- **THEN** 系统所有测试可使用扩展的断言方法

### Requirement: 测试辅助工具路径别名

系统 SHALL 配置 `@/test-helpers` 路径别名，指向 `src/__test__/helpers` 目录。

#### Scenario: 配置 vite.config.ts 别名
- **WHEN** `vite.config.ts` 的 `resolve.alias` 包含 `@/test-helpers`
- **THEN** 系统 `import { ... } from '@/test-helpers/mocks'` 正确解析

#### Scenario: 配置 tsconfig.json 别名
- **WHEN** `tsconfig.json` 的 `compilerOptions.paths` 包含 `@/test-helpers/*`
- **THEN** 系统 TypeScript 提供正确的类型提示

### Requirement: 改进的 setup.ts 结构

系统 SHALL 重构 `setup.ts` 采用模块化结构，清晰分离不同职责。

#### Scenario: 分离断言配置
- **WHEN** `setup.ts` 导入 `./helpers/assertions/setup`
- **THEN** 系统断言扩展逻辑独立于 Mock 配置

#### Scenario: 分离 Mock 配置
- **WHEN** `setup.ts` 导入 `./helpers/mocks/setup`
- **THEN** 系统 Mock 配置逻辑独立于断言配置

### Requirement: 测试辅助工具目录结构

系统 SHALL 创建标准化的测试辅助工具目录结构。

#### Scenario: 创建 helpers 目录
- **WHEN** 初始化测试辅助工具系统
- **THEN** 系统创建 `src/__test__/helpers/` 目录
- **AND** 系统创建 `mocks/`、`fixtures/`、`assertions/`、`isolation/` 子目录

#### Scenario: 创建统一导出文件
- **WHEN** 测试需要使用辅助工具
- **THEN** 系统可通过 `import { ... } from '@/test-helpers'` 导入所有工具
