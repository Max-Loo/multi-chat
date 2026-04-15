# test-placeholder-elimination

## Purpose

确保测试套件中不存在占位断言（如 `expect(true).toBe(true)`），所有测试用例均包含有意义的断言，且测试套件可以全部通过。

## Requirements

### Requirement: 测试套件中不允许存在占位断言

系统 SHALL 确保所有测试用例包含有意义的断言，不允许使用 `expect(true).toBe(true)` 或其他恒真断言模式。

#### Scenario: 识别占位断言
- **WHEN** 审查测试代码发现 `expect(true).toBe(true)` 模式
- **THEN** 该测试用例 SHALL 被标记为无效并删除或替换

#### Scenario: 删除无对应行为的占位测试
- **WHEN** 占位测试的注释表明是"未来扩展点"且源代码逻辑简单
- **THEN** SHALL 直接删除该测试用例

#### Scenario: 重写有对应行为的占位测试
- **WHEN** 占位测试对应的源代码存在可观察行为（如函数调用、状态变更、返回值）
- **THEN** SHALL 将占位断言替换为验证该行为的实际断言

### Requirement: 测试套件必须全部通过

系统 SHALL 确保测试套件中所有测试文件均可正常构建和通过。

#### Scenario: 验证全绿状态
- **WHEN** 执行完整测试套件
- **THEN** 所有测试 SHALL 通过，失败数量为 0
