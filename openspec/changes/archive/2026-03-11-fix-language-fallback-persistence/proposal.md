# 语言降级持久化修复提案

## Why

当 localStorage 中的语言代码无效时（如不再支持的语言代码），`getDefaultAppLanguage()` 会删除该无效缓存并降级到系统语言或英语。但降级后的语言代码没有写回 localStorage，导致每次刷新页面都会重复执行降级逻辑并显示 Toast 提示，严重影响用户体验。

## What Changes

- **修改 `appConfigMiddleware`**：让它同时监听 `initializeAppLanguage.fulfilled` 和 `setAppLanguage` actions
- **移除 `initI18n()` 中的副作用**：删除 localStorage 写入和 Toast 提示逻辑
- **统一持久化和 Toast 逻辑**：所有语言变更的持久化和用户反馈都通过 Redux middleware 处理
- **确保语言状态一致性**：防止用户在 Redux store 初始化完成前刷新页面时重复触发降级逻辑
- **优化用户体验**：避免重复 Toast 提示，只在用户主动切换语言时显示反馈

## Capabilities

### Modified Capabilities
- **language-detection**: 语言降级行为变更，从"删除缓存后不持久化"改为"删除缓存后持久化降级语言"

## Impact

**受影响的代码**：
- `src/store/middleware/appConfigMiddleware.ts` - 添加 `initializeAppLanguage.fulfilled` 监听，优化数据源选择逻辑
- `src/lib/i18n.ts` 中的 `initI18n()` 函数 - 删除 localStorage 写入和 Toast 提示逻辑

**不涉及**：
- API 变更
- 依赖变更
- 数据库变更
- 其他系统

**测试影响**：
- 需要更新 `src/__test__/lib/global.test.ts` 中的相关测试用例，验证降级后 localStorage 被正确设置
