## ADDED Requirements

### Requirement: 三路环境分支覆盖
测试 SHALL 覆盖 `createFetch()` 的三种环境分支，验证每种环境下返回正确的 fetch 实现。

#### Scenario: DEV 环境使用原生 fetch
- **WHEN** `import.meta.env.DEV` 为 true
- **THEN** `createFetch()` 返回 `window.fetch`，不尝试动态导入 `@tauri-apps/plugin-http`

#### Scenario: 生产环境 + Tauri 平台使用插件 fetch
- **WHEN** `import.meta.env.DEV` 为 false 且 `isTauri()` 返回 true
- **THEN** `createFetch()` 动态导入 `@tauri-apps/plugin-http` 并返回其 `fetch` 导出

#### Scenario: 生产环境 + Tauri 插件导入失败降级
- **WHEN** `import.meta.env.DEV` 为 false、`isTauri()` 返回 true，但动态导入 `@tauri-apps/plugin-http` 抛出异常
- **THEN** `createFetch()` 记录 `console.warn` 并降级返回 `window.fetch`

#### Scenario: 生产环境 + Web 平台使用原生 fetch
- **WHEN** `import.meta.env.DEV` 为 false 且 `isTauri()` 返回 false
- **THEN** `createFetch()` 返回 `window.fetch`，不尝试动态导入

### Requirement: fetch 和 getFetchFunc 实例一致性
测试 SHALL 验证导出的 `fetch` 和 `getFetchFunc()` 返回同一函数实例。

#### Scenario: getFetchFunc 返回与 fetch 相同的函数
- **WHEN** 模块加载完成后调用 `getFetchFunc()`
- **THEN** 返回的函数与直接导出的 `fetch` 是同一引用

### Requirement: fetch 请求委托验证
测试 SHALL 验证导出的 `fetch` 正确委托给内部 `_fetchInstance`。

#### Scenario: fetch 调用委托给内部实例
- **WHEN** 调用导出的 `fetch(url, options)`
- **THEN** 参数被正确传递给内部 fetch 实例，返回值被正确转发
