# Chat Sidebar 测试规范

## ADDED Requirements

### Requirement: ChatButton 聊天按钮组件
系统 SHALL 提供聊天列表中的单个聊天按钮，支持导航、重命名、删除操作，以及编辑模式切换。

#### Scenario: 渲染聊天按钮
- **WHEN** 聊天列表包含一个聊天
- **THEN** 系统应显示聊天按钮
- **AND** 应显示聊天名称（或"未命名"默认文本）
- **AND** 应突出显示当前选中的聊天

#### Scenario: 点击聊天按钮导航
- **WHEN** 用户点击聊天按钮
- **THEN** 系统应调用 navigateToChat
- **AND** 应传入当前聊天的 ID
- **AND** URL 应更新为对应的聊天详情页

#### Scenario: 打开更多操作菜单
- **WHEN** 用户点击聊天按钮的更多菜单图标
- **THEN** 系统应显示下拉菜单
- **AND** 菜单应包含"重命名"和"删除"选项

#### Scenario: 启动重命名模式
- **WHEN** 用户点击"重命名"菜单项
- **THEN** 系统应显示输入框
- **AND** 输入框应预填充当前聊天名称
- **AND** 聊天按钮应进入编辑状态

#### Scenario: 取消重命名
- **WHEN** 用户在重命名模式下点击取消按钮
- **THEN** 系统应关闭输入框
- **AND** 应恢复显示聊天名称
- **AND** 不应修改聊天名称

#### Scenario: 确认重命名
- **WHEN** 用户在输入框中输入新名称并确认
- **AND** 新名称与旧名称不同
- **THEN** 系统应调用 editChatName Redux action
- **AND** 应传入聊天 ID 和新名称
- **AND** 应退出编辑模式

#### Scenario: 重命名为相同名称
- **WHEN** 用户在输入框中输入与当前名称相同的文本并确认
- **THEN** 系统应退出编辑模式
- **AND** 不应调用 editChatName action

#### Scenario: 重命名为空字符串
- **WHEN** 用户清空输入框并尝试确认
- **THEN** 系统应阻止提交
- **AND** 应保持编辑模式
- **AND** 不应调用 editChatName action

#### Scenario: 删除聊天 - 显示确认对话框
- **WHEN** 用户点击"删除"菜单项
- **THEN** 系统应显示确认对话框
- **AND** 对话框应显示"确认删除「聊天名称」？"
- **AND** 应显示警告描述

#### Scenario: 删除聊天 - 确认删除
- **WHEN** 用户在确认对话框中点击"确认"
- **THEN** 系统应调用 deleteChat Redux action
- **AND** 应显示成功 Toast（"删除成功"）
- **AND** 如果删除的是当前选中的聊天，应清除 URL 参数

#### Scenario: 删除聊天 - 取消操作
- **WHEN** 用户在确认对话框中点击"取消"
- **THEN** 系统应关闭对话框
- **AND** 不应执行删除操作

#### Scenario: 删除操作失败
- **WHEN** 删除操作抛出异常
- **THEN** 系统应显示错误 Toast（"删除失败"）
- **AND** 应保留当前聊天列表

#### Scenario: 重命名操作失败
- **WHEN** 重命名操作抛出异常
- **THEN** 系统应显示错误提示
- **AND** 应保持编辑模式

### Requirement: ToolsBar 工具栏组件
系统 SHALL 提供聊天侧边栏的工具栏，支持创建新聊天、搜索功能和侧边栏折叠。

#### Scenario: 渲染默认工具栏
- **WHEN** 用户在非搜索模式下查看侧边栏
- **THEN** 系统应显示以下按钮：
  - 折叠侧边栏按钮
  - 创建新聊天按钮
  - 搜索按钮

#### Scenario: 创建新聊天
- **WHEN** 用户点击"创建新聊天"按钮
- **THEN** 系统应生成新的聊天对象（包含唯一 ID 和空名称）
- **AND** 应调用 createChat Redux action
- **AND** 应调用 navigateToChat 导航到新聊天

#### Scenario: 进入搜索模式
- **WHEN** 用户点击搜索按钮
- **THEN** 系统应切换到搜索模式
- **AND** 应显示返回按钮
- **AND** 应显示搜索输入框
- **AND** 应自动聚焦搜索输入框

#### Scenario: 搜索输入
- **WHEN** 用户在搜索输入框中输入文本
- **THEN** 系统应调用 onFilterChange 回调
- **AND** 应传入输入的过滤文本

#### Scenario: 退出搜索模式
- **WHEN** 用户在搜索模式下点击返回按钮
- **THEN** 系统应退出搜索模式
- **AND** 应调用 onFilterChange 并传入空字符串
- **AND** 应重置搜索状态

#### Scenario: 折叠侧边栏
- **WHEN** 用户点击折叠侧边栏按钮
- **THEN** 系统应调用 setIsCollapsed Redux action
- **AND** 应传入 true
- **AND** 侧边栏应收起

#### Scenario: 搜索模式隐藏创建和搜索按钮
- **WHEN** 工具栏处于搜索模式
- **THEN** 系统应隐藏"创建新聊天"按钮
- **AND** 应隐藏"搜索"按钮
- **AND** 应显示返回按钮和搜索输入框

#### Scenario: 自动聚焦搜索输入框
- **WHEN** 用户进入搜索模式
- **THEN** 搜索输入框应自动获得焦点（autoFocus=true）
- **AND** 用户可以立即输入搜索文本

### Requirement: ChatButton 与 Redux 集成
系统 SHALL 通过 Redux 正确管理聊天状态和导航状态。

#### Scenario: 获取当前选中聊天 ID
- **WHEN** ChatButton 组件渲染
- **THEN** 应使用 useAppSelector 订阅 state.chat.selectedChatId
- **AND** 应根据 selectedChatId 高亮对应按钮

#### Scenario: 调用 Redux actions
- **WHEN** 用户执行重命名操作
- **THEN** 应使用 useAppDispatch 获取 dispatch
- **AND** 应调用 dispatch(editChatName({ chatId, name }))

#### Scenario: 调用删除后导航
- **WHEN** 用户删除当前选中的聊天
- **THEN** 应调用 navigateToChat() 不传参数
- **AND** 应清除 URL 中的 chatId 参数

### Requirement: ToolsBar 与导航系统集成
系统 SHALL 能够创建新聊天并导航到对应的聊天详情页。

#### Scenario: 生成唯一聊天 ID
- **WHEN** 系统创建新聊天
- **THEN** 应使用 generateId() 生成唯一 ID
- **AND** ID 格式应符合 AI SDK 标准

#### Scenario: 新聊天导航
- **WHEN** 新聊天创建成功
- **THEN** 应调用 navigateToChat({ chatId: newChat.id })
- **AND** URL 应更新为 /chat?chatId=newChat.id

#### Scenario: 新聊天初始状态
- **WHEN** 新聊天创建
- **THEN** 聊天名称应为空字符串
- **AND** 聊天应在列表中显示为"未命名"

### Requirement: 组件与 i18n 集成
系统 SHALL 支持多语言，所有文本应使用翻译 key。

#### Scenario: ChatButton 文本翻译
- **WHEN** 用户切换应用语言
- **THEN** 对话框标题、按钮文本、Toast 消息应使用对应语言

#### Scenario: ToolsBar 按钮提示
- **WHEN** 用户悬停在工具栏按钮上
- **THEN** 按钮的 title 属性应显示当前语言的提示文本

### Requirement: 组件交互和可访问性
系统 SHALL 提供良好的用户体验和可访问性支持。

#### Scenario: ChatButton 键盘导航
- **WHEN** 用户使用 Tab 键浏览聊天列表
- **THEN** 聊天按钮应可获得焦点
- **AND** Enter 键应触发导航

#### Scenario: 下拉菜单可访问性
- **WHEN** 用户打开更多菜单
- **THEN** 菜单项应可通过键盘选择
- **AND** 应支持方向键导航

#### Scenario: 输入框焦点管理
- **WHEN** 用户进入重命名模式
- **THEN** 输入框应自动获得焦点
- **AND** 应全选文本便于快速修改

### Requirement: ChatButton memo 优化
系统 SHALL 使用 React.memo 优化 ChatButton 组件性能。

#### Scenario: 避免不必要的重渲染
- **WHEN** 父组件重新渲染但 chat prop 未变化
- **THEN** ChatButton 不应重新渲染
- **AND** 应使用浅比较比较 chat 对象

#### Scenario: chat prop 变化时更新
- **WHEN** 聊天对象发生变化（名称、选中状态）
- **THEN** ChatButton 应重新渲染
- **AND** 应显示最新的聊天信息

### Requirement: 搜索过滤功能
系统 SHALL 提供实时搜索过滤功能，支持过滤聊天列表。

#### Scenario: 搜索输入防抖
- **WHEN** 用户快速输入搜索文本
- **THEN** 系统应使用防抖处理 onFilterChange 调用
- **AND** 默认延迟应为 300ms

#### Scenario: 空搜索文本重置过滤
- **WHEN** 用户清空搜索输入框
- **THEN** 系统应调用 onFilterChange('')
- **AND** 应显示完整的聊天列表

#### Scenario: 搜索文本包含特殊字符
- **WHEN** 用户输入包含特殊字符的搜索文本（如 *、?、）
- **THEN** 系统应将搜索文本作为纯字符串处理
- **AND** 不应解析为正则表达式
