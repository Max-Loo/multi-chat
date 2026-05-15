## ADDED Requirements

### Requirement: 变异测试 SHALL 验证 createFetch 三路环境分支
测试套件 SHALL 杀死 `import.meta.env.DEV` 和 `isTauri()` 的条件变异体。

#### Scenario: DEV 环境不检查 isTauri 直接返回原生 fetch
- **WHEN** DEV=true 且 isTauri()=true
- **THEN** SHALL 返回原生 fetch（不调用 Tauri 插件）

#### Scenario: 生产 + Tauri 环境使用 Tauri fetch
- **WHEN** DEV=false 且 isTauri()=true
- **THEN** SHALL 返回 Tauri 插件的 fetch 函数

#### Scenario: 生产 + Web 环境使用原生 fetch
- **WHEN** DEV=false 且 isTauri()=false
- **THEN** SHALL 返回原生 fetch，不尝试动态导入

### Requirement: 变异测试 SHALL 验证 Tauri 插件导入失败降级
测试套件 SHALL 杀掉 `catch → originFetch` 的降级路径变异体。

#### Scenario: 动态导入失败降级到原生 fetch
- **WHEN** DEV=false、isTauri()=true 且 import('@tauri-apps/plugin-http') 抛出错误
- **THEN** SHALL 输出 console.warn 并降级到原生 fetch

### Requirement: 变异测试 SHALL 验证 getFetchFunc 实例一致性
测试套件 SHALL 杀死 `return _fetchInstance` 的返回值变异体。

#### Scenario: 多次调用返回同一函数引用
- **WHEN** 连续调用 getFetchFunc()
- **THEN** SHALL 返回引用相等的函数（toBe）

### Requirement: 变异测试 SHALL 验证 fetch 函数参数透传
测试套件 SHALL 杀死 `return _fetchInstance(input, init)` 的调用变异体。

#### Scenario: fetch 带完整参数透传
- **WHEN** 调用 fetch(url, { method: 'POST' })
- **THEN** SHALL 将 url 和 { method: 'POST' } 原样传递给内部 fetch 实例

#### Scenario: fetch 无 init 参数透传
- **WHEN** 调用 fetch(url)
- **THEN** SHALL 将 url 和 undefined 传递给内部 fetch 实例
