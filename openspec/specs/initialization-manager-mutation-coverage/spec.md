# initialization-manager-mutation-coverage

## Purpose

变异测试覆盖率要求：确保 InitializationManager 的错误分级条件组合和 ExecutionContext 数据传递逻辑具备充分的变异测试保护。

## Requirements

### Requirement: 变异测试 SHALL 验证错误分级条件组合
测试套件 SHALL 杀死 `step.critical && initError.severity === 'fatal'` 的条件变异体，覆盖 critical 和 severity 的交叉组合。

#### Scenario: critical=false + severity=fatal 不中断
- **WHEN** 非关键步骤抛出致命错误
- **THEN** SHALL 记录错误但继续执行后续步骤

#### Scenario: critical=true + severity=warning 不中断
- **WHEN** 关键步骤抛出警告级错误
- **THEN** SHALL 记录警告但继续执行后续步骤

### Requirement: 变异测试 SHALL 验证 ExecutionContext 数据传递
测试套件 SHALL 杀死 `context.setResult` / `context.getResult` / `context.markSuccess` 的调用变异体。

#### Scenario: 步骤间数据传递
- **WHEN** 步骤 A 通过 context 设置结果值，步骤 B 读取
- **THEN** SHALL 步骤 B 获得步骤 A 设置的值

#### Scenario: 可选字段提取到 InitResult
- **WHEN** 步骤通过 context 设置 modelProviderStatus / masterKeyRegenerated / decryptionFailureCount
- **THEN** SHALL 对应字段出现在 InitResult 中
