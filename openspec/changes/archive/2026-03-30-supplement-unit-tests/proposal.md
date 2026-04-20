## Why

经过全面的测试覆盖分析，项目存在两类测试缺口：（1）6 个工具函数/Hook/Redux slice 模块完全缺少单元测试，其中包括安全相关的 `htmlEscape` 和广泛使用的 `constants`/`urlUtils`；（2）4 个现有测试文件存在不完整或跳过的测试用例（`useIsChatSending`、`chatMiddleware`、`providerFactory`、`appConfigMiddleware`）。这些缺口降低了代码变更的安全网质量。

## What Changes

- 新增 `src/utils/htmlEscape.ts` 单元测试（XSS 防护相关，安全关键）
- 新增 `src/utils/urlUtils.ts` 单元测试
- 新增 `src/utils/constants.ts` 单元测试（语言配置、查找、迁移）
- 新增 `src/utils/providerUtils.ts` 单元测试
- 新增 `src/components/FilterInput/hooks/useDebouncedFilter.ts` 单元测试
- 新增 `src/store/slices/modelPageSlices.ts` 单元测试
- 新增 `src/store/slices/settingPageSlices.ts` 单元测试
- 修复 `useIsChatSending.test.ts` 中未完成的测试用例
- 补充 `chatMiddleware.test.ts` 中自动命名触发逻辑测试
- 补充 `providerFactory.test.ts` 错误处理测试
- 补充 `appConfigMiddleware.test.ts` 中 setAutoNamingEnabled 持久化测试

## Capabilities

### New Capabilities
- `html-escape-testing`: HTML 转义函数的完整单元测试覆盖，含安全边界用例
- `url-utils-testing`: URL 参数清理工具函数的单元测试
- `constants-testing`: 语言配置查找、迁移映射、集合完整性的单元测试
- `provider-utils-testing`: 供应商 logo URL 构建工具函数的单元测试
- `debounced-filter-testing`: 防抖过滤 Hook 的单元测试
- `page-slice-testing`: 模型页面和设置页面 Redux slice 的单元测试
- `test-gap-fixes`: 现有测试文件中不完整/跳过用例的修复与补充

### Modified Capabilities
（无 spec 级别行为变更，仅补充测试用例）

## Impact

- **测试文件**：新增 7 个测试文件，修改 4 个现有测试文件
- **源代码**：无变更，纯测试补充
- **依赖**：无新增依赖，使用现有 vitest + @testing-library/react 测试框架
- **CI**：无影响，测试数量增加但不改变运行方式
