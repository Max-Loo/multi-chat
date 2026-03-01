# 提案：初始化系统单元测试

## Why

初始化系统（InitializationManager）是应用启动的核心组件，负责管理所有初始化步骤的执行、依赖关系和错误处理。在之前的 `refactor-initialization-system` 变更中实现了该系统，但跳过了单元测试的编写。

当前缺少单元测试导致：
- **无法保证核心逻辑的正确性**：拓扑排序、循环依赖检测、依赖验证等复杂逻辑未经测试覆盖
- **难以防止回归**：未来修改可能破坏现有功能，缺乏自动化验证
- **代码质量风险**：错误处理、边界条件等场景未经验证
- **重构信心不足**：没有测试覆盖，重构或优化变得更加困难

## What Changes

### 新增内容

- **InitializationManager 单元测试**：测试初始化流程的核心功能
  - 成功场景：所有步骤按正确顺序执行
  - 错误处理：致命错误、警告错误、可忽略错误的分类和处理
  - 进度回调：验证 onProgress 回调正确触发
  - 并行执行：验证无依赖步骤并行执行

- **ExecutionContext 单元测试**：测试执行上下文的数据管理
  - setResult/getResult：数据存储和检索
  - isSuccess：步骤状态跟踪

- **拓扑排序算法测试**：验证步骤执行顺序的正确性
  - 无依赖步骤的执行
  - 有依赖步骤的顺序
  - 复杂依赖图的处理

- **依赖验证测试**：验证依赖关系的完整性
  - 依赖存在的检查
  - 依赖不存在时的错误提示

- **循环依赖检测测试**：验证循环依赖的检测能力
  - 简单循环依赖（A→B→A）
  - 复杂循环依赖（A→B→C→A）
  - 跨层循环依赖

- **错误处理测试**：验证三级错误处理机制
  - 致命错误中断初始化
  - 警告错误继续执行
  - 可忽略错误静默处理

- **initSteps 配置验证测试**：验证初始化步骤配置的正确性
  - 步骤名称唯一性检查
  - 依赖的步骤存在性验证
  - 必要字段完整性检查
  - 错误严重程度有效性验证
  - 配置结构类型安全验证

- **集成测试增强**：使用真实 initSteps 配置进行端到端测试
  - 验证所有步骤能被 InitializationManager 正确执行
  - 验证依赖关系按预期解析
  - 验证步骤执行顺序符合拓扑排序结果

- **FatalErrorScreen UI 组件测试**：验证致命错误提示组件的功能
  - 错误列表正确渲染（单个和多个错误）
  - 刷新按钮交互（mock `window.location.reload`）
  - DEV 模式下错误详情展开/收起功能
  - 错误信息国际化（i18n）
  - 不同严重程度错误的展示

### 修改内容

- **测试基础设施**：无需修改现有测试框架（Vitest）
- **测试覆盖率目标**：将初始化系统的覆盖率提升至 80% 以上

## Capabilities

### New Capabilities

- **initialization-system-testing**: 初始化系统测试能力，覆盖所有核心功能和边界条件

### Modified Capabilities

无（不涉及现有功能需求变更）

## Impact

### 受影响的代码模块

- **新增测试文件**：
  - `src/__test__/lib/initialization/InitializationManager.test.ts`
  - `src/__test__/lib/initialization/ExecutionContext.test.ts`
  - `src/__test__/config/initSteps.test.ts`
  - `src/__test__/components/FatalErrorScreen.test.tsx`（新增）
  - 可能需要 `src/__test__/lib/initialization/fixtures.ts`（测试辅助工具）

- **测试覆盖率目标**：
  - `src/lib/initialization/InitializationManager.ts`: 80%+ 覆盖率
  - `src/lib/initialization/types.ts`: 90%+ 覆盖率（主要是类型定义）
  - `src/config/initSteps.ts`: 70%+ 覆盖率（配置验证测试）
  - `src/components/FatalErrorScreen/index.tsx`: 75%+ 覆盖率

### 依赖变更

- **无新增外部依赖**：使用现有的 Vitest 测试框架
- **测试辅助工具**：可能需要创建 Mock 工厂和测试数据生成器

### 代码质量影响

- **正面影响**：
  - 提高代码质量和可靠性
  - 防止未来修改引入回归
  - 提供重构信心
  - 作为功能文档（测试即文档）

- **开发体验**：
  - 新功能开发时可以快速验证
  - CI/CD 流程中自动运行，及早发现问题
