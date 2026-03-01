# 聊天页面状态管理测试规格

## Purpose

定义聊天页面状态管理（Redux slice）的测试要求，确保侧边栏折叠状态和页面显示状态能够正确管理和更新。

## Requirements

### Requirement: 聊天页面 Slice 必须验证侧边栏折叠状态变更
chatPageSlices 必须提供 setIsCollapsed reducer 来更新侧边栏折叠状态。

#### Scenario: 折叠侧边栏
- **WHEN** dispatch setIsCollapsed action，参数为 true
- **THEN** state.isSidebarCollapsed 必须更新为 true
- **THEN** 其他状态字段必须保持不变

#### Scenario: 展开侧边栏
- **WHEN** dispatch setIsCollapsed action，参数为 false
- **THEN** state.isSidebarCollapsed 必须更新为 false
- **THEN** 其他状态字段必须保持不变

### Requirement: 聊天页面 Slice 必须验证聊天页面显示状态变更
chatPageSlices 必须提供 setIsShowChatPage reducer 来控制聊天页面的显示/隐藏。

#### Scenario: 显示聊天页面
- **WHEN** dispatch setIsShowChatPage action，参数为 true
- **THEN** state.isShowChatPage 必须更新为 true
- **THEN** 其他状态字段必须保持不变

#### Scenario: 隐藏聊天页面
- **WHEN** dispatch setIsShowChatPage action，参数为 false
- **THEN** state.isShowChatPage 必须更新为 false
- **THEN** 其他状态字段必须保持不变

### Requirement: 聊天页面 Slice 必须验证初始状态
chatPageSlices 必须在创建时设置正确的初始状态。

#### Scenario: 初始状态必须为侧边栏展开和页面显示
- **WHEN** 创建 chatPageSlice
- **THEN** state.isSidebarCollapsed 必须为 false
- **THEN** state.isShowChatPage 必须为 true
- **THEN** 不应包含其他未定义的字段

### Requirement: 聊天页面 Slice 必须验证 Redux Toolkit 最佳实践
chatPageSlices 必须使用 Redux Toolkit 的 createSlice 正确实现，包括 immutable 更新和 action creators。

#### Scenario: Reducer 必须保持不可变性
- **WHEN** dispatch setIsCollapsed action
- **THEN** 必须返回新的 state 对象，而不是修改原 state
- **THEN** 原始 state 对象必须保持不变

#### Scenario: Action creators 必须正确生成
- **WHEN** import chatPageActions
- **THEN** 必须包含 setIsCollapsed 和 setIsShowChatPage action creators
- **THEN** 每个 action creator 必须接受正确的 payload 类型

#### Scenario: Slice 必须正确导出 reducer 和 actions
- **WHEN** import chatPageReducer 和 chatPageActions
- **THEN** chatPageReducer 必须是一个有效的 Redux reducer 函数
- **THEN** chatPageActions 必须包含所有定义的 action creators

### Requirement: 聊天页面 Slice 必须验证与 Redux store 的集成
chatPageSlices 必须能够正确集成到 Redux store 中。

#### Scenario: Reducer 必须在 store 中正常工作
- **WHEN** 创建 Redux store 并注册 chatPageReducer
- **THEN** store 必须包含 chatPage 状态分支
- **THEN** 初始状态必须符合预期

#### Scenario: 多个 dispatch 必须正确处理
- **WHEN** 连续 dispatch 多个 chatPage actions
- **THEN** 每个 dispatch 都必须独立更新对应的状态字段
- **THEN** 最后的状态必须反映所有 dispatch 的累积结果

#### Scenario: 不相关的 action 不应影响 state
- **WHEN** dispatch 其他 slice 的 action
- **THEN** chatPage state 必须保持不变
- **THEN** 不应抛出错误
