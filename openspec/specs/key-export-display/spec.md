## ADDED Requirements

### Requirement: 密钥导出使用展示+复制模式
系统 SHALL 将密钥导出从"确认后自动复制"模式改为"确认后展示密钥并提供复制按钮"模式。

#### Scenario: 用户触发密钥导出
- **WHEN** 用户点击"导出密钥"按钮
- **THEN** 系统弹出安全警告确认对话框

#### Scenario: 用户确认安全警告
- **WHEN** 用户在安全警告对话框中点击"确认"
- **THEN** 系统异步获取主密钥
- **THEN** 系统在同一对话框内展示密钥内容（只读等宽字体 Input）和"复制到剪贴板"按钮
- **THEN** 安全警告文本保留在对话框中

#### Scenario: 用户点击复制按钮
- **WHEN** 用户点击"复制到剪贴板"按钮
- **THEN** 系统将密钥复制到系统剪贴板（使用已缓存的 key，无 async gap）
- **THEN** 显示复制成功提示
- **THEN** 对话框关闭

#### Scenario: 复制失败时的 fallback
- **WHEN** 用户点击"复制到剪贴板"按钮但剪贴板写入失败
- **THEN** 系统显示复制失败错误提示
- **THEN** 密钥仍展示在 Input 中，用户可手动选中并复制

### Requirement: 导出状态管理
系统 SHALL 使用 exportState（null | "warning" | string）三态管理导出对话框生命周期。

#### Scenario: exportState 为 null 时
- **WHEN** exportState 状态为 null
- **THEN** 对话框不显示

#### Scenario: exportState 为 "warning" 时
- **WHEN** 用户点击"导出密钥"按钮
- **THEN** 系统 SHALL 将 exportState 设为 "warning"
- **THEN** 对话框显示安全警告确认界面
- **THEN** 确认按钮处于可用状态

#### Scenario: 确认后加载密钥
- **WHEN** 用户在警告界面点击"确认"
- **THEN** 系统 SHALL 异步调用 exportMasterKey()
- **THEN** 加载期间确认按钮 SHALL 禁用，防止重复提交
- **THEN** 成功时将 exportState 设为密钥字符串值
- **THEN** 失败时显示错误 toast 并将 exportState 重置为 null

#### Scenario: 关闭对话框时清除状态
- **WHEN** 用户通过 ESC 键、点击遮罩或完成复制后关闭对话框
- **THEN** 系统 SHALL 将 exportState 重置为 null

### Requirement: 密钥获取失败处理
系统 SHALL 在密钥获取失败时显示错误提示。

#### Scenario: exportMasterKey 抛出异常
- **WHEN** 用户确认安全警告后，exportMasterKey() 抛出异常
- **THEN** 系统显示导出失败错误提示
- **THEN** 对话框关闭，exportedKey 重置为 null
