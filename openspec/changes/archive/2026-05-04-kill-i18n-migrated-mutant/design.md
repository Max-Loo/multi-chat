## Context

i18n.ts L219 的 `migrated: false` 是 `initI18n` 中 `languageResult` 的默认值，当 `getDefaultAppLanguage()` 抛出异常时生效。当前变异测试中 `migrated: false → true` 变异体存活（i18n.ts 总分 92.25%）。

现有测试 `i18n.test.ts:319` 试图通过验证"不触发迁移 toast"来杀死此变异体，但未能成功。

## Goals / Non-Goals

**Goals:**
- 消除 i18n.ts L219 BooleanLiteral 存活变异体
- 将 i18n.ts 变异得分从 92.25% 提升

**Non-Goals:**
- 不修改 i18n.ts 生产代码逻辑
- 不处理其他 8 个存活变异体（属于不同变更的范围）

## Decisions

### Decision 1: 确认为等价变异体，使用 Stryker disable 排除

**分析**：默认值 `{ lang: "en", migrated: false }` 中 `migrated` 的唯一消费点是 L229：

```typescript
if (languageResult.migrated && languageResult.from) {
```

默认值没有 `from` 属性，因此：
- `migrated: false` → `false && undefined` → `false`
- `migrated: true`（变异后）→ `true && undefined` → `false`

两条路径的外部可观测行为完全一致。该变异体是**等价变异体** — 不存在能杀死它的测试，因为 `&&` 短路使 `migrated` 在 `from` 缺失时始终无副作用。

**方案**：在 L219 添加 `// Stryker disable BooleanLiteral` 注释排除此变异体。这是 Stryker 官方推荐的等价变异体处理方式，避免编写虚假测试。

### Decision 2: 修正现有测试的误导性注释

现有测试 L336 的注释 `// 默认 migrated=false → 不触发迁移 toast（杀死 line 219 BooleanLiteral 变异体）` 暗示该测试能杀死变异体，但实际不能。修正注释以反映真实情况。

## Risks / Trade-offs

- **使用 Stryker disable 而非补充测试**：排除了一个变异体，得分计算的分母减小。这是正确的权衡 — 等价变异体不应计入得分。
- **不影响生产代码行为**：仅添加 Stryker 注释和修正测试注释。
