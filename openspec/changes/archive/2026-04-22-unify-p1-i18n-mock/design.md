## Context

项目已在 `setup.ts` 中定义了标准 i18n mock 工厂 `globalThis.__createI18nMockReturn`，并被 `drawer-state.integration.test.tsx` 等文件使用。但 6 个文件仍使用各自的手动 mock 实现，模式各异：

| 模式 | 文件数 | 实现方式 |
|------|--------|----------|
| Selector-based `t()` | 3 | `t: (key) => key` + 复杂的 `Trans` 组件 mock |
| Proxy | 2 | `new Proxy({}, { get: ... })` |
| `importOriginal` | 1 | 混合原始模块与自定义 mock |

## Goals / Non-Goals

**Goals:**
- 6 个文件全部使用 `globalThis.__createI18nMockReturn` 工厂
- 消除 i18n mock 的实现差异

**Non-Goals:**
- 不修改 `__createI18nMockReturn` 工厂本身的实现
- 不修改已使用该工厂的文件

## Decisions

### Decision 1: 统一到 `__createI18nMockReturn` 模式

**选择**: 将 6 个文件的 mock 全部替换为：
```typescript
vi.mock('react-i18next', () => {
  const R = { chat: { thinking: '思考中...' } /* 按文件测试断言构造 */ };
  return globalThis.__createI18nMockReturn(R);
});
```

**理由**: 这是项目中 48 个文件已使用的标准模式。`R` 为翻译资源对象，其键值需从原 mock 中提取（4 个文件的测试对中文翻译文本有断言，`R` 必须包含这些精确值）。工厂已支持 selector 函数（`t($ => $.chat.thinking)`）和 dot-notation 键（`t('chat.thinking')`），无需额外扩展。

### Decision 2: 逐文件转换并验证

**选择**: 每转换一个文件后运行该文件的测试，确认行为等价。

**理由**: 6 个文件的 mock 模式不同，转换风险各异。逐步验证比批量转换更安全。

## Risks / Trade-offs

- **[风险] `__createI18nMockReturn` 不支持 selector-based `t()`** → 先检查工厂实现，必要时扩展
- **[风险] 某些测试依赖 mock 的特定行为** → 转换后逐个运行验证
