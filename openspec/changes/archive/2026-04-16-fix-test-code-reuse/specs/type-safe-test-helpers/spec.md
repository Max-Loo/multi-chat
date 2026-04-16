## MODIFIED Requirements

### Requirement: asTestType 类型转换辅助函数
`helpers/testing-utils.tsx` SHALL 提供 `asTestType<T>(value: unknown): T` 函数，作为 `as unknown as` 模式的类型安全替代。所有测试文件中的 `as unknown as` 类型转换 SHALL 统一替换为 `asTestType<T>()` 调用。

#### Scenario: 替换 as unknown as 类型转换
- **WHEN** 测试代码需要将一个值强制转换为目标类型（原本使用 `value as unknown as TargetType`）
- **THEN** SHALL 使用 `asTestType<TargetType>(value)` 替代

#### Scenario: 替换后测试行为不变
- **WHEN** 将 `as unknown as` 替换为 `asTestType<T>()`
- **THEN** 该测试用例 SHALL 产生与替换前相同的通过/失败结果
