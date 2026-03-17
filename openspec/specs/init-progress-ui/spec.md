## Purpose

TBD

## Requirements

### Requirement: 显示初始化进度条

系统 SHALL 在应用初始化过程中显示一个线性进度条，展示当前初始化进度。进度条 SHALL 从 0% 开始显示。

#### Scenario: 正常初始化流程
- **WHEN** 应用开始初始化
- **THEN** 系统显示一个进度条，从 0% 开始
- **AND** 随着初始化步骤完成，进度条逐渐增长到 100%

#### Scenario: 进度初始值
- **WHEN** InitializationController 组件首次渲染
- **THEN** 进度条显示为 0%

#### Scenario: 并行步骤完成
- **WHEN** 多个初始化步骤并行完成
- **THEN** 进度条可能跳跃式更新（如 12% → 37%）
- **AND** 进度条最终达到 100%

### Requirement: 显示百分比

系统 SHALL 在进度条右侧显示当前进度的百分比。

#### Scenario: 进度信息显示
- **WHEN** 初始化进行中
- **THEN** 系统在进度条右侧显示百分比数字（如 "62%"）

### Requirement: 显示动态加载文本

系统 SHALL 在进度条下方显示动态加载文本 "Initializing application..." 配合三个点的循环动画。

#### Scenario: 三个点动画
- **WHEN** 初始化进行中
- **THEN** 系统显示 "Initializing application."
- **AND** 500ms 后显示 "Initializing application.."
- **AND** 500ms 后显示 "Initializing application..."
- **AND** 500ms 后回到 "Initializing application."
- **AND** 循环直到初始化完成

### Requirement: 初始化完成后延迟

系统 SHALL 在初始化完成后等待 500ms 再进入应用主界面。

#### Scenario: 快速初始化
- **WHEN** 初始化在 100ms 内完成
- **THEN** 系统显示进度条达到 100%
- **AND** 等待 500ms
- **AND** 然后进入应用主界面

#### Scenario: 正常初始化
- **WHEN** 初始化在 1s 内完成
- **THEN** 系统显示进度条逐渐增长到 100%
- **AND** 等待 500ms
- **AND** 然后进入应用主界面

### Requirement: 初始化失败时显示错误界面

系统 SHALL 在关键初始化步骤失败时显示致命错误界面，保持与现有错误处理逻辑一致。

#### Scenario: 关键步骤失败
- **WHEN** 关键步骤（i18n 或 masterKey）初始化失败
- **THEN** 系统显示 FatalErrorScreen
- **AND** 显示错误信息和刷新按钮

#### Scenario: 无可用供应商
- **WHEN** 初始化成功但无法获取模型供应商数据
- **THEN** 系统显示 NoProvidersAvailable 界面

### Requirement: 初始化阶段使用英文文本

系统 SHALL 在初始化阶段使用英文硬编码文本，不依赖 i18n 系统。

#### Scenario: i18n 就绪前显示文本
- **WHEN** i18n 步骤尚未完成
- **THEN** 系统仍能正常显示 "Initializing application..." 文本
- **AND** 不因 i18n 未就绪而显示错误或空白
