# 提案：为项目添加 Vitest 测试系统

## Why

目前项目没有任何测试框架，无法确保代码质量和功能正确性。随着项目复杂度增加，缺乏测试将导致：
- 重构和功能迭代时难以验证现有功能是否被破坏
- 无法提前发现潜在 bug，增加生产环境风险
- 新功能开发缺乏自动化验证手段

现在引入测试框架可以：
- 提升代码质量和可维护性
- 支持测试驱动开发（TDD）流程
- 为后续需求开发建立质量保障体系

## What Changes

- **新增**: 安装并配置 Vitest 测试框架及其依赖
- **新增**: 在 `vite.config.ts` 中集成 Vitest 测试配置
- **新增**: 创建 `src/__test__/` 目录用于存放测试代码
- **新增**: 创建 `src/__mock__/` 目录用于存放 mock 数据
- **新增**: 添加测试脚本到 `package.json`（test、test:ui、test:coverage 等）
- **新增**: 配置测试覆盖率报告
- **新增**: 安装必要的测试辅助库（如 @testing-library/react 用于 React 组件测试）

## Capabilities

### New Capabilities
- `vitest-framework`: 提供单元测试、集成测试和端到端测试的核心能力
- `test-configuration`: 统一的测试配置管理，与现有 Vite 配置无缝集成
- `test-mock-data`: Mock 数据管理，支持隔离测试环境

### Modified Capabilities
- (无现有能力的需求级别变更，仅新增测试能力)

## Impact

**受影响的文件**:
- `vite.config.ts` - 添加 Vitest 测试配置
- `package.json` - 添加测试脚本和依赖

**新增目录**:
- `src/__test__/` - 测试代码目录
- `src/__mock__/` - Mock 数据目录

**新增依赖**:
- `vitest` - 核心测试框架
- `@vitest/ui` - 测试可视化界面
- `@vitest/coverage-v8` - 代码覆盖率工具
- `@testing-library/react` - React 组件测试工具
- `@testing-library/jest-dom` - DOM 断言扩展
- `@testing-library/user-event` - 用户交互模拟
- `happy-dom` - DOM 环境模拟（**选择理由**见下方说明）

**技术选型说明 - happy-dom vs jsdom**：

本项目选择 **happy-dom** 作为 DOM 环境，原因如下：

1. **性能优势**：比 jsdom 快 3-10 倍，大幅提升测试执行速度
2. **现代化技术栈**：项目使用 React 19、Vite 7、TypeScript 5.9，无遗留代码负担，happy-dom 对现代 API 支持更好
3. **Vitest 深度集成**：Vitest 官方默认推荐，配置更简洁，与 @testing-library/react 配合更好
4. **资源占用更低**：内存和包体积更小，对桌面应用开发更友好
5. **适用场景匹配**：主要测试组件逻辑和用户交互，无需复杂的 CSSOM 计算（Tailwind CSS 在构建时处理）

未来如需真实浏览器环境，可无缝切换至 Vitest 4.0 Browser Mode。

**配置变更**:
- `vite.config.ts` 添加 `test` 配置块，包含：
  - 测试环境设置（使用 `happy-dom`）
  - 路径别名配置（与主配置保持一致）
  - 覆盖率配置
  - Mock 文件路径配置
  - 测试文件匹配模式

**工作流变更**:
- 开发新功能时需同步编写测试代码
- 代码审查时需检查测试覆盖率
