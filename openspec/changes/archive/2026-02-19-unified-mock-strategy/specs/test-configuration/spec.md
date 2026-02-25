# test-configuration Spec (Delta)

## Purpose

扩展现有测试配置，添加统一的 Mock 配置入口、全局测试辅助工具导入、改进的 `setup.ts` 结构，支持新的统一 Mock 策略系统。

## ADDED Requirements

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

---

### Requirement: 全局测试辅助工具导入

系统 SHALL 在 `setup.ts` 中自动导入全局测试辅助工具，使其在所有测试中可用。

#### Scenario: 导入自定义断言

- **WHEN** `setup.ts` 导入 `@/test-helpers/assertions`
- **THEN** 系统所有测试文件可直接使用自定义断言函数

#### Scenario: 扩展 Vitest matchers

- **WHEN** `setup.ts` 调用 `expect.extend(customMatchers)`
- **THEN** 系统所有测试可使用扩展的断言方法

---

### Requirement: 测试辅助工具路径别名

系统 SHALL 配置 `@/test-helpers` 路径别名，指向 `src/__test__/helpers` 目录。

#### Scenario: 配置 vite.config.ts 别名

- **WHEN** `vite.config.ts` 的 `resolve.alias` 包含 `@/test-helpers`
- **THEN** 系统 `import { ... } from '@/test-helpers/mocks'` 正确解析

#### Scenario: 配置 tsconfig.json 别名

- **WHEN** `tsconfig.json` 的 `compilerOptions.paths` 包含 `@/test-helpers/*`
- **THEN** 系统 TypeScript 提供正确的类型提示

---

### Requirement: 改进的 setup.ts 结构

系统 SHALL 重构 `setup.ts` 采用模块化结构，清晰分离不同职责。

#### Scenario: 分离断言配置

- **WHEN** `setup.ts` 导入 `./helpers/assertions/setup`
- **THEN** 系统断言扩展逻辑独立于 Mock 配置

#### Scenario: 分离 Mock 配置

- **WHEN** `setup.ts` 导入 `./helpers/mocks/setup`
- **THEN** 系统 Mock 配置逻辑独立于断言配置

---

### Requirement: 测试辅助工具目录结构

系统 SHALL 创建标准化的测试辅助工具目录结构。

#### Scenario: 创建 helpers 目录

- **WHEN** 初始化测试辅助工具系统
- **THEN** 系统创建 `src/__test__/helpers/` 目录
- **AND** 系统创建 `mocks/`、`fixtures/`、`assertions/`、`isolation/` 子目录

#### Scenario: 创建统一导出文件

- **WHEN** 测试需要使用辅助工具
- **THEN** 系统可通过 `import { ... } from '@/test-helpers'` 导入所有工具
