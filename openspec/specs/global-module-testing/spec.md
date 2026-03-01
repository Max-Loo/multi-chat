# global-module-testing - Capability Specification

## Purpose

提供全局模块（外部链接拦截、语言检测）的单元测试规范，确保核心工具函数的可靠性和覆盖率。

## Requirements

### Requirement: 外部链接拦截测试
测试系统 SHALL 验证 `interceptClickAToJump()` 函数能够正确拦截外部链接（非同源链接）的点击事件，并使用 `shell.open()` 打开外部链接。

#### Scenario: 拦截外部链接点击
- **WHEN** 用户点击指向外部域的 `<a>` 标签（href 属性的 origin 与 window.location.origin 不同）
- **THEN** 系统 SHALL 阻止默认导航行为（preventDefault）
- **AND** 系统 SHALL 调用 `shell.open(url.href)` 打开外部链接

#### Scenario: 不拦截内部链接点击
- **WHEN** 用户点击指向同源的 `<a>` 标签（href 属性的 origin 与 window.location.origin 相同）
- **THEN** 系统 SHALL 不阻止默认导航行为
- **AND** 系统 SHALL 不调用 `shell.open()`

#### Scenario: 忽略非 a 标签元素
- **WHEN** 用户点击非 `<a>` 标签的元素（如 div、span 等）
- **THEN** 系统 SHALL 不执行任何操作
- **AND** 系统 SHALL 不调用 `shell.open()`

#### Scenario: 正确识别嵌套的 a 标签
- **WHEN** 用户点击嵌套在 `<a>` 标签内的子元素（如 `<a><span>点击</span></a>`）
- **THEN** 系统 SHALL 使用 `closest('a')` 正确识别父级 `<a>` 标签
- **AND** 系统 SHALL 根据识别到的链接执行相应的拦截或不拦截逻辑

### Requirement: 语言检测测试
测试系统 SHALL 验证 `getDefaultAppLanguage()` 函数能够按照正确的优先级顺序获取应用语言，并在各级缓存/检测失败时回退到默认语言。

#### Scenario: localStorage 优先级最高
- **WHEN** localStorage 中存在 `multi-chat-language` 键
- **AND** 该键的值为有效的语言代码（如 'zh' 或 'en'）
- **THEN** 系统 SHALL 返回 localStorage 中的语言代码
- **AND** 系统 SHALL 不调用系统语言检测 API

#### Scenario: 系统语言检测作为第二优先级
- **WHEN** localStorage 中不存在 `multi-chat-language` 键
- **AND** 系统语言 API 返回有效的 locale（如 'zh-CN'、'en-US'）
- **AND** 提取的语言前缀（'zh'、'en'）在 `SUPPORTED_LANGUAGE_LIST` 中
- **THEN** 系统 SHALL 返回系统语言的前缀（如 'zh'、'en'）

#### Scenario: 不支持系统语言时回退到默认
- **WHEN** localStorage 中不存在 `multi-chat-language` 键
- **AND** 系统语言 API 返回的 locale 不在 `SUPPORTED_LANGUAGE_LIST` 中（如 'fr-FR'）
- **THEN** 系统 SHALL 回退到默认语言 'en'

#### Scenario: 所有检测失败时返回默认语言
- **WHEN** localStorage 中不存在 `multi-chat-language` 键
- **AND** 系统语言 API 返回 null 或 undefined
- **THEN** 系统 SHALL 返回默认语言 'en'

### Requirement: 测试覆盖率要求
测试系统 SHALL 确保所有代码路径都被测试覆盖，达到 100% 的语句覆盖率目标。

#### Scenario: 覆盖所有分支路径
- **WHEN** 执行所有测试用例
- **THEN** `interceptClickAToJump()` 函数的所有分支（外部链接、内部链接、非 a 标签、嵌套元素） SHALL 被覆盖
- **AND** `getDefaultAppLanguage()` 函数的所有分支（localStorage、系统语言支持、系统语言不支持、默认回退） SHALL 被覆盖
- **AND** 整体语句覆盖率 SHALL 达到 100%

#### Scenario: 使用项目测试辅助工具
- **WHEN** 编写测试用例
- **THEN** 测试 SHALL 使用 `@/test-helpers` 中提供的 Mock 工厂（如 `createTauriMocks`）
- **AND** 测试 SHALL 使用 Vitest 断言和 Testing Library 工具
- **AND** 测试 SHALL 在测试后正确清理 Mock 状态（使用 `resetAll()`）
