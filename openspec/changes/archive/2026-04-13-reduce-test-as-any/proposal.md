## Why

测试代码中有 **194 处 `as any` 类型断言**，分布在 50+ 个测试文件中。这些断言绕过了 TypeScript 的类型检查，导致：重构 slice/reducer 时测试不会报错（"假绿"）；Mock 对象与真实类型渐行渐远，增加维护成本；新建测试时复制粘贴 `as any` 模式成为默认选择，而非思考类型安全方案。

## What Changes

- 新增 **类型安全的 RootState 工厂函数**（`createTestRootState`），替代分散在各测试文件中的 `preloadedState: { ... } as any` 模式
- 新增 **类型安全的 Test Store 工厂函数**（`createTypeSafeTestStore`），替代 `reducer: { ... } as any` 模式
- 新增 **扩展 Error 类型的 Mock 工厂**（`createAIError`），替代 `helpers/mocks/aiSdk.ts` 中的 `(error as any).statusCode` 模式
- 新增 **HighlightLanguageManager 测试辅助方法**，替代 `(manager as any).resolveAlias` 等私有成员访问模式
- 逐文件替换现有的 `as any` 为类型安全方案，目标减少 80% 以上

## Capabilities

### New Capabilities
- `type-safe-test-helpers`: 类型安全的测试工具函数集，包括 RootState 工厂、Test Store 工厂、扩展 Error 工厂、类私有成员测试辅助

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **测试辅助工具**：`src/__test__/helpers/` 目录下新增/修改工厂函数
- **测试文件**：约 50 个测试文件需要将 `as any` 替换为新 API
- **源代码**：`HighlightLanguageManager` 类需新增 `@internal` 测试辅助访问器
- **无生产代码影响**：所有改动仅限于测试代码和测试辅助工具
