## Why

ProviderGrid（分支覆盖率 17.65%）和 ProviderMetadata（分支覆盖率 48.72%）是 Setting 页面 ModelProviderSetting 模块中覆盖率最低的两个组件。根因是 `ModelProviderSetting.test.tsx` 所有测试均使用空 providers 数据，导致 ProviderGrid 的非空渲染分支完全未覆盖；ProviderMetadata 的 `getDocUrl()` 仅命中 deepseek 分支，其余 3 个分支（moonshotai、zhipu、fallback）未覆盖。这两个组件属于 `pages` 模块（当前分支覆盖率 69.80%，阈值 40%），模块整体无阈值压力，但单个组件覆盖率偏低影响代码可维护性。

## What Changes

- 新建 `ProviderGrid.test.tsx`，覆盖 providers 非空时的 Masonry 渲染、`getProviderStatus` 函数的 available/unavailable 两种返回、展开/折叠交互和空状态分支
- 新建 `ProviderMetadata.test.tsx`，覆盖 `getDocUrl()` 全部 4 个分支（deepseek、moonshotai、zhipu、fallback）、API 端点/供应商 ID 显示、文档链接点击行为

## Capabilities

### New Capabilities

- `provider-grid-testing`: ProviderGrid 组件的单元测试规格，覆盖空状态、非空渲染、供应商状态判断和交互回调
- `provider-metadata-testing`: ProviderMetadata 组件的单元测试规格，覆盖文档 URL 生成全分支和元数据展示

### Modified Capabilities

（无）

## Impact

- 新增 2 个测试文件，不影响任何生产代码
- ProviderGrid 分支覆盖率从 17.65% 提升至 80%+，ProviderMetadata 从 48.72% 提升至 80%+
- 依赖现有 mock 工厂（`createMockRemoteProvider`、`createDeepSeekProvider`、`createKimiProvider`、`createZhipuProvider`）和 i18n mock
