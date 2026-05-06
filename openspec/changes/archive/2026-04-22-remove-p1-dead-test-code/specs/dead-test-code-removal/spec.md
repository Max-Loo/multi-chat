## ADDED Requirements

### Requirement: 无消费者的测试辅助代码必须删除
任何测试辅助代码（fixture、mock 工厂、helper）MUST 在确认零导入后被删除。

#### Scenario: 确认零导入后删除文件
- **WHEN** 一个测试辅助文件或导出经 grep 确认无任何测试文件导入
- **THEN** 该文件或导出 MUST 被删除

### Requirement: barrel export 不能导出已删除的模块
barrel export 文件（如 `helpers/fixtures/index.ts`）MUST NOT 导出已删除的模块。

#### Scenario: 删除模块后清理 barrel export
- **WHEN** 一个模块从 `helpers/fixtures/` 中被删除
- **THEN** 对应的 `export * from './<module>'` 行 MUST 从 `index.ts` 中移除

### Requirement: 不保留使用过时状态结构的工厂
使用过时 Redux 状态结构的 mock 工厂 MUST 被删除，即使 `as RootState` 类型断言掩盖了不一致。

#### Scenario: 过时状态结构工厂不遗留
- **WHEN** 一个 mock 工厂使用与当前 slice 结构不匹配的状态字段
- **THEN** 该工厂 MUST 被删除，而非保留供"参考"
