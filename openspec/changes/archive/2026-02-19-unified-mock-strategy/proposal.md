# 统一 Mock 策略系统提案

## Why

当前项目的测试代码中存在严重的 Mock 配置分散问题：
1. Mock 配置散布在 `setup.ts` 和各个测试文件中，缺乏统一管理
2. 测试环境不一致（同时使用 happy-dom 和 fake-indexeddb），导致 Mock 策略混乱
3. 测试隔离不彻底，部分测试依赖真实实现（如 Web Crypto API）
4. Mock 重复配置导致维护困难，修改一个 Mock 需要同步多个文件
5. 缺少统一的测试辅助函数和测试数据工厂

随着测试覆盖率的提升和新增测试的增加，这些问题会进一步恶化，影响测试的可维护性和可靠性。现在建立统一的 Mock 策略系统，可以为未来大规模测试扩展奠定基础。

## What Changes

- **创建统一的 Mock 工厂系统**：提供标准化的 Mock 创建函数，支持常见的测试场景（Tauri API、加密、存储等）
- **建立 Mock 配置中心**：将分散的 Mock 配置集中管理，提供清晰的配置层次和优先级
- **实现测试环境隔离机制**：确保每个测试用例独立运行，提供统一的 `beforeEach`/`afterEach` 清理策略
- **提供测试辅助工具库**：包含测试数据工厂、断言辅助函数、Mock 验证工具等
- **标准化测试结构**：制定清晰的测试文件组织规范和命名约定

## Capabilities

### New Capabilities

- **unified-mock-factory**: 统一的 Mock 工厂函数系统，提供常见模块的标准化 Mock（Tauri API、加密、存储、路由等），支持快速创建和重置 Mock 实例
- **mock-strategy-configuration**: Mock 配置管理系统，定义全局默认 Mock 策略、按测试套件覆盖策略、Mock 生命周期管理（创建、重置、清理）
- **test-environment-isolation**: 测试环境隔离机制，提供统一的测试前后清理钩子、状态重置工具、环境隔离验证，确保测试间互不影响
- **test-helper-utilities**: 测试辅助工具库，包含测试数据工厂（fixtures）、断言辅助函数、Mock 调用验证工具、性能测试工具

### Modified Capabilities

- **test-configuration**: 扩展现有测试配置，添加统一的 Mock 配置入口、全局测试辅助工具导入、改进的 `setup.ts` 结构

## Impact

**受影响的代码**：
- `src/__test__/setup.ts`：重构为统一的 Mock 配置入口
- 所有现有测试文件：逐步迁移到新的 Mock 工厂系统
- `src/__test__/helpers/`：新建目录，存放测试辅助工具
- `src/__test__/fixtures/`：新建目录，存放测试数据工厂

**API 变更**：
- 新增 `@/test-helpers/mocks` 模块，导出统一的 Mock 工厂函数
- 新增 `@/test-helpers/fixtures` 模块，导出测试数据生成器
- 新增 `@/test-helpers/assertions` 模块，导出自定义断言函数

**依赖变更**：
- 无新增外部依赖（复用现有的 Vitest、happy-dom、fake-indexeddb）
- 可能需要调整现有的测试辅助函数导入路径

**兼容性**：
- **非破坏性变更**：新旧 Mock 策略可以共存，逐步迁移
- 现有测试无需立即修改，可以在后续迭代中逐步迁移到新系统
