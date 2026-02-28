## Why

国际化模块（i18n.ts）是应用的核心基础功能，负责加载语言资源、初始化 i18n 配置和语言切换。目前该模块缺少单元测试，存在以下风险：

- 代码重构时无法快速验证功能正确性
- 语言资源加载逻辑变更可能导致运行时错误
- 无法确保多语言切换功能的稳定性

现在添加测试可以确保代码质量，为后续功能迭代提供安全网。

## What Changes

- 为 `src/lib/i18n.ts` 添加完整的单元测试套件
- 覆盖以下导出函数的测试：
  - `getLocalesResources()` - 验证语言资源动态加载逻辑
  - `initI18n()` - 验证 i18n 初始化流程和单例模式
  - `getInitI18nPromise()` - 验证 Promise 缓存机制
  - `changeAppLanguage()` - 验证语言切换功能
- 使用 Vitest 和相关测试工具（vi.mock 等）模拟依赖项
- Mock i18next、react-i18next 和 import.meta.glob 等外部依赖
- 目标测试覆盖率：≥70%（语句覆盖率）

## Capabilities

### New Capabilities
- `i18n-unit-testing`: 为 i18n 国际化模块提供全面的单元测试覆盖，包括资源加载、初始化、Promise 缓存和语言切换功能的验证

### Modified Capabilities
（无）

## Impact

**影响的代码文件**：
- 新增：`src/__test__/lib/i18n.test.ts`

**影响的依赖**：
- 无新增依赖（使用现有的 Vitest、vi.mock 等）

**影响系统**：
- CI/CD 测试流程（新增测试用例）
- 代码质量保障（提升测试覆盖率）

**测试策略**：
- 使用 vi.mock 模拟 i18next 和 react-i18next
- 使用 vi.mock 模拟 Vite 的 import.meta.glob
- 使用 vi.mock 模拟 getDefaultAppLanguage 函数
- 验证异步操作的正确性
- 验证错误处理逻辑
