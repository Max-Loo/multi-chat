## Why

`services/global.ts` 是语言检测和全局事件拦截的核心服务，当前行覆盖率 69.56%、分支覆盖率 68.18%，低于 services 模块阈值（75%/70%）。未覆盖区域集中在两个关键路径：外层 try-catch 异常处理（行 115-139，22 行代码无测试）和 `getLanguageLabel` 函数（行 147-149，完全无测试）。

## What Changes

- 补充 `getDefaultAppLanguage` 外层 catch 块的测试用例，覆盖异常降级到系统语言和英文的路径
- 补充 `getLanguageLabel` 函数的测试用例，覆盖支持语言返回标签和不支持语言回退两个分支
- 预期将 global.ts 行覆盖率从 69.56% 提升至 ~95%，分支覆盖率从 68.18% 提升至 ~90%

## Capabilities

### New Capabilities

- `global-error-handling-tests`: 覆盖 `getDefaultAppLanguage` 外层异常处理路径的测试规范，包括 locale() 抛异常时的系统语言降级和英文兜底
- `language-label-tests`: 覆盖 `getLanguageLabel` 函数行为的测试规范，包括有效语言标签查找和无效语言代码回退

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **测试文件**: `src/__test__/services/lib/global.test.ts` — 新增测试用例，不修改现有用例
- **源文件**: `src/services/global.ts` — 不修改，仅补充测试
- **覆盖率**: 影响 services 模块整体覆盖率统计
