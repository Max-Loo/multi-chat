## 1. 排除等价变异体

- [x] 1.1 在 `src/services/i18n.ts` L219 的 `migrated: false` 上方添加 `// Stryker disable BooleanLiteral` 注释，在相关代码块后添加 `// Stryker restore BooleanLiteral`
- [x] 1.2 修正 `src/__test__/services/lib/i18n.test.ts` L336 的注释，从 `（杀死 line 219 BooleanLiteral 变异体）` 改为准确说明该测试验证默认值降级行为

## 2. 验证

- [x] 2.1 运行 `pnpm test:mutation --mutate "src/services/i18n.ts"` 确认 BooleanLiteral 变异体已被排除，得分提升
- [x] 2.2 运行 `pnpm test:run` 确认所有测试通过
