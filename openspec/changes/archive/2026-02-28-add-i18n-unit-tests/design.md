## Context

**当前状态**：
- `src/lib/i18n.ts` 包含 4 个导出函数，但完全没有单元测试覆盖
- 项目使用 Vitest 作为测试框架，已有测试辅助工具体系（`src/__test__/helpers/`）
- i18n 依赖外部库：i18next、react-i18next、Vite 的 `import.meta.glob`

**约束条件**：
- 必须使用 Vitest 和项目现有的测试工具
- 测试文件必须遵循项目结构：`src/__test__/lib/i18n.test.ts`
- 目标覆盖率：≥70%（语句覆盖率）
- 不能修改源代码（`src/lib/i18n.ts`）

**利益相关者**：
- 开发团队：需要可靠的测试覆盖以支持重构
- CI/CD 系统：需要快速、稳定的测试用例

## Goals / Non-Goals

**Goals:**
- 为 `src/lib/i18n.ts` 的所有导出函数提供全面的单元测试覆盖
- 验证异步操作的正确性（资源加载、初始化、语言切换）
- 验证单例模式（initI18nPromise 缓存）
- 验证错误处理逻辑
- 达到 ≥70% 的语句覆盖率

**Non-Goals:**
- 集成测试（不测试与 React 组件的集成）
- E2E 测试（不测试完整的用户流程）
- 性能测试（不测试加载速度或性能）
- 修改 i18n.ts 的实现代码

## Decisions

### 1. Mock 策略：完全隔离外部依赖

**决策**：使用 Vitest 的 `vi.mock()` 完全 mock 所有外部依赖

**原因**：
- i18next 和 react-i18next 是第三方库，不需要测试其内部逻辑
- `import.meta.glob` 是 Vite 特性，在测试环境中不可用
- `getDefaultAppLanguage` 依赖系统 API，需要 mock 以保持测试一致性

**替代方案**：
- 使用真实的 i18next 库：❌ 会导致测试变慢且不稳定
- 使用部分 mock：❌ 增加复杂度，维护成本高

### 2. 测试文件结构：按函数组织测试套件

**决策**：使用 `describe` 嵌套结构，每个导出函数一个顶层 `describe`

**原因**：
- 清晰的测试组织结构
- 易于定位失败的测试
- 便于后续维护

**示例结构**：
```typescript
describe('getLocalesResources', () => { ... })
describe('initI18n', () => { ... })
describe('getInitI18nPromise', () => { ... })
describe('changeAppLanguage', () => { ... })
```

### 3. 异步测试策略：使用 async/await 和 vi.useFakeTimers

**决策**：使用 `async/await` 处理异步操作，必要时使用 `vi.useFakeTimers()` 控制时间

**原因**：
- `getLocalesResources`、`initI18n`、`changeAppLanguage` 都是异步函数
- Vitest 原生支持 async 测试
- `vi.useFakeTimers()` 可用于测试 Promise 缓存的时序

### 4. 测试数据：使用固定的 mock 数据

**决策**：在 `beforeEach` 中设置固定的 mock 返回值

**原因**：
- 确保测试的可重复性
- 避免测试之间的依赖
- 便于理解测试预期

**Mock 数据示例**：
```typescript
const mockLocaleModules = {
  '../locales/en/common.json': () => ({ default: { hello: 'Hello' } }),
  '../locales/zh/common.json': () => ({ default: { hello: '你好' } }),
}
```

### 5. 覆盖率目标：≥70% 语句覆盖率

**决策**：聚焦于核心逻辑路径，不追求 100% 覆盖率

**原因**：
- 错误处理分支（catch 块）难以触发
- 70% 足以覆盖主要功能和边界情况
- 过度追求覆盖率会增加维护成本

## Risks / Trade-offs

### 风险 1：Mock 不完整导致测试遗漏真实问题
**缓解措施**：
- 仔细审查所有依赖项的 mock
- 定期运行集成测试验证整体功能
- 代码审查时检查 mock 的完整性

### 风险 2：import.meta.glob 的 mock 可能不够精确
**缓解措施**：
- 模拟真实的模块加载行为
- 测试多个语言文件的加载场景
- 验证返回的数据结构符合预期

### 风险 3：Promise 缓存的单例模式测试可能不稳定
**缓解措施**：
- 在每个测试后使用 `vi.clearAllMocks()` 和 `vi.resetModules()` 清理状态
- 使用独立的测试作用域
- 验证多次调用返回同一个 Promise 实例

### 权衡 1：测试复杂度 vs 覆盖率
- **决策**：优先覆盖核心功能和常见场景，不测试极端边界情况
- **原因**：时间和资源有限，70% 覆盖率已足够保障质量

### 权衡 2：Mock 精确度 vs 测试稳定性
- **决策**：使用简单但稳定的 mock，不追求完美的模拟
- **原因**：测试的稳定性比完美的 mock 更重要

## Migration Plan

**步骤**：
1. 创建测试文件 `src/__test__/lib/i18n.test.ts`
2. 设置 mock（i18next、react-i18next、import.meta.glob、getDefaultAppLanguage）
3. 实现 `getLocalesResources` 的测试套件
4. 实现 `initI18n` 的测试套件
5. 实现 `getInitI18nPromise` 的测试套件
6. 实现 `changeAppLanguage` 的测试套件
7. 运行 `pnpm test:coverage` 验证覆盖率
8. 如有必要，补充测试用例以达到 70% 覆盖率
9. 代码审查和迭代优化

**回滚策略**：
- 如果测试无法通过，可以删除测试文件回滚到无测试状态
- 不影响生产代码

## Open Questions

**无** - 这是一个相对简单的单元测试任务，没有未解决的技术决策。
