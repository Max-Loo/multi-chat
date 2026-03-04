# Redux 应用配置中间件测试规格

## Purpose

定义 Redux 应用配置中间件的测试要求，确保中间件能够正确处理语言切换、推理内容配置等功能的持久化和 i18n 更新。

## Requirements

### Requirement: 配置中间件必须验证语言切换时的持久化和 i18n 更新
当用户通过 Redux action 切换应用语言时，中间件必须将新语言持久化到 localStorage，并触发 i18n 的 changeAppLanguage 函数。

#### Scenario: 成功切换语言并持久化
- **WHEN** 用户 dispatch setAppLanguage action，参数为 'zh'
- **THEN** 中间件必须调用 localStorage.setItem，键为 LOCAL_STORAGE_LANGUAGE_KEY，值为 'zh'
- **THEN** 中间件必须调用 changeAppLanguage 函数，参数为 'zh'
- **THEN** action 必须正常传递到下一个中间件

#### Scenario: 切换为英语并持久化
- **WHEN** 用户 dispatch setAppLanguage action，参数为 'en'
- **THEN** 中间件必须调用 localStorage.setItem，键为 LOCAL_STORAGE_LANGUAGE_KEY，值为 'en'
- **THEN** 中间件必须调用 changeAppLanguage 函数，参数为 'en'

#### Scenario: localStorage 调用失败时不应阻止 action
- **WHEN** 用户 dispatch setAppLanguage action
- **AND** localStorage.setItem 抛出错误
- **THEN** action 必须正常传递到下一个中间件
- **THEN** 不应抛出未捕获的异常

### Requirement: 配置中间件必须验证推理内容配置的持久化
当用户切换推理内容包含配置时，中间件必须将新配置持久化到 localStorage。

#### Scenario: 启用推理内容并持久化
- **WHEN** 用户 dispatch setIncludeReasoningContent action，参数为 true
- **THEN** 中间件必须调用 localStorage.setItem，键为 LOCAL_STORAGE_INCLUDE_REASONING_KEY，值为 'true'
- **THEN** action 必须正常传递到下一个中间件

#### Scenario: 禁用推理内容并持久化
- **WHEN** 用户 dispatch setIncludeReasoningContent action，参数为 false
- **THEN** 中间件必须调用 localStorage.setItem，键为 LOCAL_STORAGE_INCLUDE_REASONING_KEY，值为 'false'
- **THEN** action 必须正常传递到下一个中间件

### Requirement: 配置中间件必须验证监听器正确注册和触发
中间件必须使用 Redux Toolkit 的 createListenerMiddleware 创建监听器，并在 appConfig reducer 的特定 action 触发时执行副作用。

#### Scenario: 监听器必须响应 setAppLanguage action
- **WHEN** appConfig reducer 中 setAppLanguage action 被触发
- **THEN** 监听器必须执行持久化逻辑
- **THEN** 监听器必须调用 i18n 更新函数

#### Scenario: 监听器必须响应 setIncludeReasoningContent action
- **WHEN** appConfig reducer 中 setIncludeReasoningContent action 被触发
- **THEN** 监听器必须执行持久化逻辑
- **THEN** 不应调用 i18n 更新函数

#### Scenario: 监听器不应响应其他 action
- **WHEN** dispatch 其他非 appConfig 相关的 action
- **THEN** 监听器不应执行任何副作用
- **THEN** action 必须正常传递到下一个中间件

### Requirement: 配置中间件必须验证与 Redux store 的集成
中间件必须正确集成到 Redux store 中，并与其他中间件协作正常。

#### Scenario: 中间件必须在 store 初始化时正确注册
- **WHEN** 创建 Redux store
- **AND** 中间件通过 middleware.prepend() 注册
- **THEN** store 必须包含该中间件
- **THEN** 中间件必须在其他中间件之前执行

#### Scenario: 中间件必须与 Redux DevTools 兼容
- **WHEN** 启用 Redux DevTools
- **AND** dispatch setAppLanguage action
- **THEN** DevTools 必须显示完整的 action 历史
- **THEN** 中间件的副作用不应破坏 DevTools 的功能
