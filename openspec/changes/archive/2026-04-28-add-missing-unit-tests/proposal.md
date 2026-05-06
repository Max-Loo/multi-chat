## Why

项目测试审查中发现 4 个源文件缺少测试覆盖，且均包含不可忽视的业务逻辑：语言包动态加载路由（40+ 分支）、IndexedDB 异步初始化（三个事件分支）、表单验证错误联动、locale 感知的日期格式化。补充这些测试可以堵住潜在的回归漏洞。

## What Changes

- 为 `src/utils/highlightLanguageIndex.ts` 的 `loadLanguageModule` 函数新增单元测试，覆盖已知语言路由和 `default` 错误分支
- 为 `src/utils/tauriCompat/indexedDB.ts` 的 `initIndexedDB` 函数新增单元测试，覆盖 `error`、`success`、`upgradeneeded` 三个事件分支
- 为 `src/pages/Model/components/ModelSelect.tsx` 新增组件测试，覆盖 `useFormField` 验证错误边框和 RadioGroup 选中回调
- 为 `src/pages/Setting/.../ProviderHeader.tsx` 新增组件测试，覆盖 `formatLastUpdate` 的 zh/en locale 切换、loading 状态和刷新按钮交互

## Capabilities

### New Capabilities
- `highlight-language-index-testing`: `loadLanguageModule` 函数的单元测试，验证语言到模块的映射正确性、动态 import 路由和未知语言错误抛出
- `indexeddb-init-testing`: `initIndexedDB` 函数的单元测试，验证 Promise 包装的 IndexedDB 事件处理（error/success/upgradeneeded）
- `model-select-testing`: Model 页面 ModelSelect 组件的单元测试，验证表单验证错误样式联动和 RadioGroup 交互
- `provider-header-testing`: ProviderHeader 组件的单元测试，验证 locale 感知日期格式化和加载状态 UI

### Modified Capabilities
（无）

## Impact

- **新增文件**: 4 个测试文件，放置在 `src/__test__/` 对应目录下
- **依赖**: 无新增依赖，使用现有测试基础设施（vitest、@testing-library/react、已有 mock 工厂）
- **现有代码**: 不修改任何生产代码，纯测试增量
