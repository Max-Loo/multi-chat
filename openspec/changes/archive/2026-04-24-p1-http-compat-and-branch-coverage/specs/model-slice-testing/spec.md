## MODIFIED Requirements

### Requirement: 模型加载失败状态回滚
测试 SHALL 覆盖 modelSlice 中模型加载和远程获取的错误分支。

#### Scenario: 远程模型获取失败
- **WHEN** 远程模型服务抛出异常
- **THEN** store 状态包含错误信息，加载状态恢复，现有模型列表不变
