# Spec: 安全翻译机制

## Purpose

提供安全的翻译函数 `tSafely()`，用于在非 React 环境中获取翻译文本，具有完善的降级机制和异常处理，确保在 i18n 系统未初始化或翻译加载失败时仍能正常工作。

## Requirements

### Requirement: tSafely 函数可用性

系统 MUST 在 `src/lib/i18n.ts` 中导出 `tSafely()` 函数，用于在非 React 环境中安全地获取翻译文本。

#### Scenario: 函数导出
- **WHEN** 任何模块导入 `tSafely` from `@/lib/i18n`
- **THEN** 函数 MUST 可用且类型正确

#### Scenario: 函数签名
- **WHEN** 调用 `tSafely(key, fallback)`
- **THEN** 第一个参数 MUST 是翻译键（string 类型，接受 null/undefined）
- **AND** 第二个参数 MUST 是降级文本（string 类型，接受 null/undefined）
- **AND** 返回值 MUST 是翻译后的文本（string 类型，始终返回非空字符串）

#### Scenario: TypeScript 类型导出
- **WHEN** 开发者需要使用 tSafely 的类型
- **THEN** 系统 MUST 导出 `SafeTranslator` 类型别名
- **AND** 类型 MUST 定义为 `typeof tSafely`

### Requirement: i18n 未初始化时的降级

当 i18n 系统未初始化时，`tSafely()` MUST 返回降级文本。

#### Scenario: i18n 未初始化
- **GIVEN** i18n.isInitialized 为 false
- **WHEN** 调用 `tSafely('error.initialization.i18nFailed', 'Fallback message')`
- **THEN** 系统 MUST 返回 'Fallback message'
- **AND** MUST NOT 抛出异常

#### Scenario: 降级文本作为后备
- **GIVEN** i18n 未初始化
- **WHEN** 多个地方调用 `tSafely()`
- **THEN** 所有调用 MUST 都能正常工作并返回各自的降级文本

### Requirement: i18n 已初始化时的翻译

当 i18n 系统已初始化时，`tSafely()` MUST 返回翻译后的文本。

#### Scenario: 翻译存在
- **GIVEN** i18n.isInitialized 为 true
- **AND** 翻译键 'error.initialization.i18nFailed' 存在且已加载
- **WHEN** 调用 `tSafely('error.initialization.i18nFailed', 'Fallback')`
- **THEN** 系统 MUST 返回翻译后的文本（如 "无法初始化国际化配置"）
- **AND** MUST NOT 返回降级文本

#### Scenario: 翻译不存在时的降级
- **GIVEN** i18n.isInitialized 为 true
- **AND** 翻译键 'nonexistent.key' 不存在
- **WHEN** 调用 `tSafely('nonexistent.key', 'Fallback message')`
- **THEN** 系统 MUST 返回 'Fallback message'
- **AND** MUST NOT 返回翻译键本身

#### Scenario: 动态加载失败时的降级
- **GIVEN** i18n.isInitialized 为 true
- **AND** 当前语言为中文或法文（非英文）
- **AND** 该语言的 error.json 动态加载失败（网络错误/文件不存在）
- **WHEN** 调用 `tSafely('error.initialization.i18nFailed', 'Fallback message')`
- **THEN** 系统 MUST 返回英文降级文本
- **AND** MUST 在控制台记录警告（包含加载失败的原因）
- **AND** MUST 不抛出异常或阻塞应用流程

### Requirement: 异常处理

`tSafely()` MUST 捕获所有可能的异常，确保调用方不会因为翻译失败而崩溃。

#### Scenario: i18n.t() 抛出异常
- **GIVEN** i18n.isInitialized 为 true
- **AND** 调用 i18n.t() 可能抛出异常
- **WHEN** 调用 `tSafely('any.key', 'Fallback')`
- **THEN** 系统 MUST 捕获异常并返回降级文本
- **AND** MUST NOT 让异常传播到调用方
- **AND** MUST 在控制台记录警告信息

#### Scenario: key 为 null 或 undefined
- **GIVEN** key 参数为 null 或 undefined
- **WHEN** 调用 `tSafely(null, 'Fallback')`
- **THEN** 系统 MUST 返回降级文本 'Fallback'
- **AND** MUST NOT 抛出异常

#### Scenario: fallback 为 null 或 undefined
- **GIVEN** fallback 参数为 null 或 undefined
- **WHEN** 调用 `tSafely('error.key', null)`
- **THEN** 系统 MUST 返回空字符串 ''
- **AND** MUST NOT 抛出异常

#### Scenario: 两个参数都为 null
- **GIVEN** key 和 fallback 都为 null
- **WHEN** 调用 `tSafely(null, null)`
- **THEN** 系统 MUST 返回空字符串 ''
- **AND** MUST NOT 抛出异常

#### Scenario: i18n.t() 返回非字符串类型
- **GIVEN** i18n.isInitialized 为 true
- **AND** 翻译插值导致返回数字或其他类型
- **WHEN** 调用 `tSafely('error.key', 'Fallback')`
- **THEN** 系统 MUST 识别返回类型不是字符串
- **AND** MUST 返回降级文本 'Fallback'

### Requirement: 嵌套键值支持

`tSafely()` MUST 支持使用点号分隔的嵌套键值访问。

#### Scenario: 两级嵌套
- **GIVEN** error.json 中有 `error.initialization.i18nFailed`
- **WHEN** 调用 `tSafely('error.initialization.i18nFailed', 'Fallback')`
- **THEN** 系统 MUST 正确返回嵌套翻译

#### Scenario: 三级嵌套
- **GIVEN** 翻译文件中有三级嵌套结构
- **WHEN** 使用点号分隔访问
- **THEN** 系统 MUST 正确返回深层嵌套的翻译

#### Scenario: 无效的嵌套路径
- **GIVEN** 翻译文件中不存在 `a.b.c.d.e.f` 这样的深层嵌套
- **WHEN** 调用 `tSafely('a.b.c.d.e.f', 'Fallback')`
- **THEN** 系统 MUST 返回降级文本

### Requirement: 性能要求

`tSafely()` 的性能开销 MUST 最小，适合在错误处理等关键路径中使用。

#### Scenario: 快速执行
- **WHEN** 调用 `tSafely()`
- **THEN** 函数执行时间 MUST 不超过 1ms（在 i18n 已初始化的情况下）

#### Scenario: 无副作用
- **WHEN** 多次调用 `tSafely()` 并使用相同参数
- **THEN** 每次返回的结果 MUST 一致
- **AND** MUST 不修改全局状态

### Requirement: 使用场景一致性

`tSafely()` MUST 在所有非 React 环境中使用一致的模式。

#### Scenario: Redux Thunks
- **GIVEN** Redux thunk 的异步函数中需要抛出错误
- **WHEN** 构造 Error 对象时
- **THEN** MUST 使用 `tSafely()` 获取错误消息
- **AND** 错误消息 MUST 包含在 Error 的 message 字段中

#### Scenario: 初始化步骤
- **GIVEN** 初始化步骤的 onError 回调中
- **WHEN** 返回错误对象时
- **THEN** MUST 使用 `tSafely()` 获取错误消息（i18n 初始化步骤除外）

#### Scenario: 非 i18n 初始化步骤
- **GIVEN** i18n 初始化步骤的 onError 回调
- **WHEN** 构造错误消息时
- **THEN** MUST NOT 调用 `tSafely()`
- **AND** MUST 使用英文常量（避免无限循环）

### Requirement: 降级文本质量

降级文本 MUST 提供有意义且易于理解的信息。

#### Scenario: 英文降级文本
- **GIVEN** 使用英文作为降级语言
- **WHEN** 提供降级文本
- **THEN** 文本 MUST 使用简洁的英文
- **AND** MUST 准确描述错误情况
- **AND** MUST 不包含技术术语（除非必要）

#### Scenario: 降级文本一致性
- **WHEN** 为不同的错误消息提供降级文本
- **THEN** 降级文本的风格和语气 MUST 保持一致
- **AND** MUST 与翻译文本的语义等价
