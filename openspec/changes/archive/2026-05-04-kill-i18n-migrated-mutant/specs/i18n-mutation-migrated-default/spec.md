## ADDED Requirements

### Requirement: i18n migrated 默认值等价变异体 SHALL 被排除

`initI18n` 中 `languageResult` 默认值的 `migrated: false` BooleanLiteral 变异体为等价变异体（默认值无 `from` 属性，`migrated && from` 始终短路为 `false`）。SHALL 使用 Stryker disable 注释排除该变异体，并修正相关测试注释。

#### Scenario: Stryker 排除等价变异体
- **WHEN** Stryker 对 i18n.ts 运行变异测试
- **THEN** SHALL 跳过 L219 的 BooleanLiteral 变异体（标记为 Ignored）

#### Scenario: 测试注释准确反映能力
- **WHEN** 查看 `i18n.test.ts` 中 getDefaultAppLanguage 抛出异常的测试
- **THEN** 注释 SHALL 准确说明该测试验证默认值降级行为，而非声称能杀死 `migrated` 变异体
