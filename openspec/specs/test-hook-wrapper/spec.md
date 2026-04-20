## ADDED Requirements

### Requirement: renderHookWithProviders 函数

系统 SHALL 在 `src/__test__/helpers/render/redux.tsx` 中导出 `renderHookWithProviders` 函数，该函数接受一个 hook 和可选配置（store、preloadedState），返回 `renderHook` 的结果和 store 实例。

#### Scenario: 使用默认 store 渲染 hook

- **WHEN** 调用 `renderHookWithProviders(() => useMyHook())` 不传入 store
- **THEN** 函数 SHALL 内部创建一个 `createTypeSafeTestStore` 默认 store 并包裹在 `<Provider>` 中传递给 `renderHook`

#### Scenario: 使用自定义 store 渲染 hook

- **WHEN** 调用 `renderHookWithProviders(() => useMyHook(), { store })` 传入自定义 store
- **THEN** 函数 SHALL 使用传入的 store 包裹在 `<Provider>` 中传递给 `renderHook`

#### Scenario: 使用 preloadedState 创建 store

- **WHEN** 调用 `renderHookWithProviders(() => useMyHook(), { preloadedState })` 传入 preloadedState
- **THEN** 函数 SHALL 使用 `createTypeSafeTestStore(preloadedState)` 创建 store

### Requirement: hook 测试文件统一使用 renderHookWithProviders

所有 7 个 hook 测试文件 SHALL 删除本地的 `createWrapper` 函数定义，改用 `renderHookWithProviders`。

#### Scenario: hook 测试不再定义 createWrapper

- **WHEN** 检查 `src/__test__/hooks/` 目录下的所有测试文件
- **THEN** 不 SHALL 包含 `const createWrapper` 或 `function createWrapper` 的本地定义

#### Scenario: hook 测试导入 renderHookWithProviders

- **WHEN** 检查 `src/__test__/hooks/` 目录下的所有测试文件
- **THEN** 所有使用 `renderHook` 的文件 SHALL 从 `@/__test__/helpers/render/redux` 导入 `renderHookWithProviders`
