## ADDED Requirements

### Requirement: 错误 Alert 具有充足的内边距和行间距

系统 SHALL 在 FatalErrorScreen 中为每个错误 Alert 提供充足的内边距（至少 `p-4`）和行间距（至少 `gap-2`），使错误信息清晰可读。

#### Scenario: 显示单个错误信息
- **WHEN** FatalErrorScreen 收到一个包含 message 的 InitError
- **THEN** 该错误以 `<Alert variant="destructive">` 展示，内边距至少为 `p-4`，标题与描述之间有至少 `gap-2` 的间距

#### Scenario: 显示多个错误信息
- **WHEN** FatalErrorScreen 收到多个 InitError
- **THEN** 每个错误 Alert 之间有至少 `gap-3` 的间距，所有 Alert 保持一致的尺寸和间距

### Requirement: 按钮区使用分割线区分主操作与危险操作

系统 SHALL 将刷新按钮作为主操作独占一行，通过分割线与下方危险操作（主密钥恢复、重置数据）分隔。

#### Scenario: 仅显示刷新和重置按钮（无主密钥错误）
- **WHEN** 错误列表中不包含 stepName 为 masterKey 的错误
- **THEN** 显示刷新按钮（独占一行），下方分割线，再下方显示重置数据按钮

#### Scenario: 显示所有三个按钮
- **WHEN** 错误列表中包含 stepName 为 masterKey 的错误
- **THEN** 显示刷新按钮（独占一行），下方分割线，再下方横向并排显示主密钥恢复按钮和重置数据按钮

### Requirement: 危险操作按钮横向并排

系统 SHALL 将主密钥恢复导入按钮和重置数据按钮横向并排排列，按钮之间保持至少 `gap-3` 的间距。

#### Scenario: 两个危险操作按钮横向排列
- **WHEN** 主密钥恢复按钮和重置数据按钮同时显示
- **THEN** 两个按钮在同一行横向排列，间距至少为 `gap-3`

#### Scenario: 窄屏幕下按钮换行
- **WHEN** 视口宽度不足以横向容纳两个按钮
- **THEN** 按钮自动换行为竖向排列，保持可点击性
