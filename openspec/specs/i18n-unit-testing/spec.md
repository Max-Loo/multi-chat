# i18n-unit-testing Capability Specification

## ADDED Requirements

### Requirement: 语言资源加载测试
系统 MUST 提供 `getLocalesResources()` 函数的单元测试，验证语言资源的动态加载逻辑。

#### Scenario: 成功加载多个语言文件
- **WHEN** 调用 `getLocalesResources()` 函数
- **THEN** 返回包含所有语言资源的对象
- **AND** 每个语言代码（如 'en'、'zh'）都有对应的 `translation` 属性
- **AND** 每个语言的 `translation` 对象包含对应的命名空间（如 'common'、'model'、'setting'）
- **AND** 语言文件内容被正确解析并添加到对应的命名空间下

#### Scenario: 正确解析文件路径和命名空间
- **WHEN** `import.meta.glob` 返回多个语言文件路径（格式为 `../locales/{lang}/{namespace}.json`）
- **THEN** 系统正确提取语言代码和命名空间名称
- **AND** 例如：`../locales/en/common.json` 被解析为 `{ lang: 'en', namespace: 'common' }`

#### Scenario: 空的模块列表处理
- **WHEN** `import.meta.glob` 返回空对象
- **THEN** 返回空的语言资源对象 `{}`

### Requirement: i18n 初始化测试
系统 MUST 提供 `initI18n()` 函数的单元测试，验证 i18n 的初始化流程和单例模式。

#### Scenario: 首次初始化成功
- **WHEN** 首次调用 `initI18n()` 函数
- **THEN** 并行调用 `getLocalesResources()` 和 `getDefaultAppLanguage()`
- **AND** 使用返回的资源初始化 i18next
- **AND** 使用返回的默认语言设置 i18n 的 `lng` 属性
- **AND** 设置回退语言为 `'en'`
- **AND** 关闭插值转义（`escapeValue: false`）
- **AND** 返回初始化 Promise

#### Scenario: 单例模式验证
- **WHEN** 多次调用 `initI18n()` 函数
- **THEN** 只执行一次实际的初始化操作
- **AND** 后续调用返回相同的 Promise 实例

#### Scenario: 初始化错误处理
- **WHEN** `getLocalesResources()` 或 `getDefaultAppLanguage()` 抛出异常
- **THEN** 捕获错误并打印到控制台
- **AND** `initI18nPromise` 保持为 `null`
- **AND** 不抛出异常到调用者

### Requirement: Promise 缓存测试
系统 MUST 提供 `getInitI18nPromise()` 函数的单元测试，验证 Promise 缓存机制的正确性。

#### Scenario: 已初始化时返回缓存的 Promise
- **WHEN** `initI18n()` 已被调用且 `initI18nPromise` 不为 null
- **THEN** `getInitI18nPromise()` 直接返回缓存的 `initI18nPromise`
- **AND** 不重新调用 `initI18n()`

#### Scenario: 未初始化时触发初始化
- **WHEN** `initI18nPromise` 为 null
- **THEN** `getInitI18nPromise()` 调用 `initI18n()`
- **AND** 返回初始化 Promise

### Requirement: 语言切换测试
系统 MUST 提供 `changeAppLanguage()` 函数的单元测试，验证语言切换功能的正确性。

#### Scenario: 成功切换语言
- **WHEN** 调用 `changeAppLanguage('zh')`
- **THEN** 调用 i18next 的 `changeLanguage()` 方法
- **AND** 传入目标语言代码 `'zh'`

#### Scenario: 切换到不支持的语言
- **WHEN** 调用 `changeAppLanguage()` 传入不存在的语言代码
- **THEN** i18next 使用回退语言（'en'）
- **AND** 函数正常完成（不抛出异常）

### Requirement: 测试覆盖率要求
系统 MUST 确保单元测试的语句覆盖率达到 70% 以上。

#### Scenario: 覆盖率验证
- **WHEN** 运行 `pnpm test:coverage` 命令
- **THEN** `src/lib/i18n.ts` 的语句覆盖率 ≥70%
- **AND** 所有导出函数都有对应的测试用例
- **AND** 主要的代码路径都被测试覆盖

### Requirement: 测试隔离和清理
系统 MUST 确保每个测试用例之间完全隔离，避免状态污染。

#### Scenario: Mock 重置
- **WHEN** 每个测试用例执行完成后
- **THEN** 使用 `vi.clearAllMocks()` 清除所有 mock 的调用记录
- **AND** 使用 `vi.resetModules()` 重置模块缓存
- **AND** 后续测试不受前面测试的影响

#### Scenario: 独立的测试数据
- **WHEN** 每个测试用例运行时
- **THEN** 使用 `beforeEach` 设置固定的 mock 数据
- **AND** 测试之间不共享状态
