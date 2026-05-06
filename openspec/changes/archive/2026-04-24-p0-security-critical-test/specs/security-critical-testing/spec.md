## ADDED Requirements

### Requirement: 密钥导出对话框取消操作
系统 SHALL 允许用户在密钥导出对话框中点击取消按钮关闭对话框，不触发任何副作用。

#### Scenario: 导出成功后点击取消关闭对话框
- **WHEN** 用户点击导出密钥按钮，密钥成功导出并显示后，点击取消按钮
- **THEN** 对话框关闭，密钥内容不再可见

#### Scenario: 导出加载中取消按钮文本为"取消"
- **WHEN** 密钥正在导出（加载中）
- **THEN** 取消按钮文本显示为"取消"，操作按钮显示为禁用状态

#### Scenario: 导出成功后取消按钮文本为"隐藏"
- **WHEN** 密钥导出成功，密钥内容已显示
- **THEN** 取消按钮文本显示为"隐藏"

### Requirement: 密钥复制失败后对话框保持打开
系统 SHALL 在剪贴板复制失败时保持对话框打开，允许用户手动选择复制密钥内容。

#### Scenario: 复制失败后对话框不关闭
- **WHEN** 密钥导出成功后点击复制按钮，`copyToClipboard` 抛出异常
- **THEN** 显示错误 toast，但密钥内容输入框仍然可见

### Requirement: 数据重置完整集成流程
系统 SHALL 在用户完成重置确认流程后调用 `resetAllData` 并刷新页面。

#### Scenario: 完整重置确认流程
- **WHEN** 用户点击重置按钮打开对话框，再点击确认按钮
- **THEN** `resetAllData` 被调用一次，成功后调用 `window.location.reload`

#### Scenario: 重置失败时阻止页面刷新
- **WHEN** 用户确认重置，但 `resetAllData` 抛出异常
- **THEN** `window.location.reload` 不被调用，`isResetting` 恢复为 false，对话框关闭

### Requirement: 并发双击防护
系统 SHALL 防止用户快速连续点击确认按钮导致重复执行重置操作。

#### Scenario: 快速连续点击确认按钮
- **WHEN** 用户在第一次点击确认后立即再次点击确认按钮
- **THEN** `resetAllData` 仅被调用一次

### Requirement: 重置确认按钮样式
系统 SHALL 为重置确认按钮使用 destructive 样式，视觉上警示用户操作的不可逆性。

#### Scenario: 确认按钮使用 destructive 样式
- **WHEN** 重置确认对话框打开
- **THEN** 确认按钮具有 `destructive` variant 或相关样式类
