## Purpose

ProviderLoader 突变测试覆盖率规格，定义测试 SHALL 验证的关键行为路径，确保突变测试工具（如 Stryker）无法存活未覆盖的逻辑分支。

## Requirements

### Requirement: 构造函数 window 环境检测分支覆盖
测试 SHALL 验证构造函数中 `typeof window !== 'undefined'` 条件分支的两个走向，确保在无窗口环境中不注册 `online` 事件监听器。

#### Scenario: 无 window 环境不注册事件监听器
- **WHEN** `window` 全局变量为 `undefined` 时实例化 ProviderLoader
- **THEN** 不注册 `online` 事件监听器，触发 `online` 事件后 `preloadProviders` 不被调用

#### Scenario: 有 window 环境正确注册事件监听器
- **WHEN** 在正常浏览器环境中实例化 ProviderLoader 并派发 `online` 事件
- **THEN** 构造函数注册的事件监听器触发 `handleNetworkRecover`，调用 `preloadProviders(allProviderKeys)`

### Requirement: ZHIPUAI_CODING_PLAN loader 返回值验证
测试 SHALL 验证 `loadProvider(ZHIPUAI_CODING_PLAN)` 的返回值为函数类型，确保动态导入的 provider 工厂正确加载。

#### Scenario: 加载 ZHIPUAI_CODING_PLAN 返回有效工厂函数
- **WHEN** 调用 `loadProvider(ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN)`
- **THEN** 返回值为函数类型（`typeof factory === 'function'`）

### Requirement: getLoader 方法测试
测试 SHALL 验证 `getLoader()` 方法返回内部 `ResourceLoader` 实例。

#### Scenario: getLoader 返回 ResourceLoader 实例
- **WHEN** 调用 `getLoader()`
- **THEN** 返回值为 `ResourceLoader` 实例，且与内部 loader 是同一个引用
