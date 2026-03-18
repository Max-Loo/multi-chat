# Toast 端到端场景测试规范

## Purpose

定义 Toast 系统端到端测试规范，确保 Toast 系统在真实用户场景中的正确性、性能和用户体验。

## Requirements

### Requirement: 用户操作反馈场景
Toast 系统必须在用户执行操作后提供及时、准确的反馈。

#### Scenario: 设置保存成功反馈
- **WHEN** 用户成功保存设置（如切换语言）
- **THEN** 系统 SHALL 显示成功 Toast
- **AND** Toast 包含操作成功的确认信息
- **AND** Toast 在适当时间后自动消失

#### Scenario: 设置保存失败反馈
- **WHEN** 用户保存设置失败（如网络错误、存储限制）
- **THEN** 系统 SHALL 显示错误 Toast
- **AND** Toast 包含清晰的错误信息
- **AND** 提供可操作的解决建议（如可能）

#### Scenario: 加载状态反馈
- **WHEN** 应用执行耗时操作（如加载数据）
- **THEN** 系统 SHALL 显示 loading Toast
- **AND** 在操作完成后自动更新为最终状态

### Requirement: 竞态条件处理
Toast 系统必须正确处理应用启动和运行期间的竞态条件。

#### Scenario: 初始化期间多 Toast 请求
- **WHEN** 应用启动时多个模块尝试显示 Toast
- **THEN** 系统 SHALL 将所有请求加入队列
- **AND** 在 `markReady()` 后按顺序显示
- **AND** 每个 Toast 间隔 500ms

#### Scenario: 组件卸载时的 Toast
- **WHEN** Toast 显示期间组件卸载（如路由变化）
- **THEN** 系统 SHALL 不抛出错误
- **AND** Toast 继续正常显示或优雅关闭

#### Scenario: 快速连续 Toast 调用
- **WHEN** 应用快速连续触发 10+ 个 Toast
- **THEN** 系统 SHALL 正确处理所有请求
- **AND** 队列机制不崩溃或丢失请求

### Requirement: 错误恢复场景
Toast 系统必须在错误发生后优雅恢复，不影响应用继续运行。

#### Scenario: Toast 显示失败恢复
- **WHEN** Toast 显示失败（如 sonner 库错误）
- **THEN** 系统 SHALL 记录错误日志
- **AND** 不影响应用其他功能
- **AND** 后续 Toast 可以正常显示

#### Scenario: 队列处理失败恢复
- **WHEN** 队列处理过程中出现错误
- **THEN** 系统 SHALL 跳过失败的 Toast
- **AND** 继续处理队列中的其他 Toast
- **AND** 记录错误详情

### Requirement: 边界情况处理
Toast 系统必须正确处理各种边界情况和极端场景。

#### Scenario: 空消息处理
- **WHEN** Toast 被传入空字符串或 null
- **THEN** 系统 SHALL 优雅处理
- **AND** 不显示 Toast 或显示默认消息

#### Scenario: 超长消息处理
- **WHEN** Toast 消息超过合理长度（如 500 字符）
- **THEN** 系统 SHALL 截断或换行显示
- **AND** 保持 UI 可读性

#### Scenario: 特殊字符处理
- **WHEN** Toast 消息包含特殊字符（如 HTML、Emoji）
- **THEN** 系统 SHALL 正确渲染
- **AND** 不执行 XSS 攻击

### Requirement: 移动端体验优化
Toast 系统必须在移动设备上提供最佳用户体验。

#### Scenario: 移动端 Toast 可访问性
- **WHEN** Toast 在移动设备上显示
- **THEN** 位置 SHALL 为 `top-center`
- **AND** 不与状态栏或其他 UI 元素冲突

#### Scenario: 移动端手势支持
- **WHEN** 用户在移动设备上使用 Toast
- **THEN** 系统 SHALL 支持滑动手势关闭 Toast
- **AND** 手势响应灵敏且流畅

#### Scenario: 移动端多 Toast 堆叠
- **WHEN** 多个 Toast 同时显示在移动设备上
- **THEN** 系统 SHALL 合理堆叠排列
- **AND** 保持每个 Toast 可见和可操作

### Requirement: 性能要求
Toast 系统必须满足性能要求，不拖慢应用响应速度。

#### Scenario: Toast 显示延迟
- **WHEN** Toast 被触发显示
- **THEN** 系统 SHALL 在 100ms 内开始渲染
- **AND** 不阻塞主线程

#### Scenario: 队列处理性能
- **WHEN** 队列中有 10+ 个待显示 Toast
- **THEN** 系统 SHALL 按顺序处理
- **AND** 不造成应用卡顿

### Requirement: 可测试性
Toast 系统必须设计为易于测试，支持各种测试场景。

#### Scenario: 单元测试覆盖
- **WHEN** 运行单元测试
- **THEN** ToasterWrapper 组件测试覆盖率 SHALL ≥ 90%

#### Scenario: 集成测试覆盖
- **WHEN** 运行集成测试
- **THEN** Toast 系统集成场景覆盖率 SHALL ≥ 80%

#### Scenario: 测试执行时间
- **WHEN** 运行所有 Toast 相关测试
- **THEN** 总执行时间 SHALL < 5 秒
