# 为 global.ts 模块添加单元测试

## Why

`src/lib/global.ts` 模块包含两个核心的全局功能：链接拦截和语言检测。这些功能是应用的基础设施，目前没有任何单元测试覆盖。为了确保代码质量和可靠性，防止回归问题，并为重构提供信心，需要为该模块添加完整的单元测试覆盖。

## What Changes

- 在 `src/__test__/lib/` 目录下创建 `global.test.ts` 测试文件
- 为 `interceptClickAToJump()` 函数添加单元测试
  - 测试外部链接点击被拦截并使用 shell.open 打开
  - 测试内部链接点击不被拦截
  - 测试非 a 标签元素点击被忽略
  - 测试嵌套的 a 标签元素能正确识别
- 为 `getDefaultAppLanguage()` 函数添加单元测试
  - 测试 localStorage 优先级（第一优先级）
  - 测试系统语言检测（第二优先级）
  - 测试不支持系统语言时回退到默认语言
  - 测试 localStorage 和系统语言都不存在时返回 'en'
- 使用 Vitest 和项目现有的测试辅助工具（Mock 工厂等）
- 确保测试覆盖率达到 100%

## Capabilities

### New Capabilities
- `global-module-testing`: 为 `src/lib/global.ts` 模块提供完整的单元测试覆盖，包括链接拦截和语言检测功能的所有代码路径

### Modified Capabilities
无

## Impact

- **新增文件**: `src/__test__/lib/global.test.ts`
- **影响代码**: `src/lib/global.ts`（测试对象，不修改源代码）
- **依赖关系**: 需要使用项目的测试辅助工具（`@/test-helpers`）和兼容层（`@/utils/tauriCompat`）的 Mock
- **测试框架**: Vitest + Testing Library
- **覆盖率目标**: 100% 语句覆盖率
