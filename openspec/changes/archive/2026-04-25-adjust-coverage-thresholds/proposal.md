## Why

当前覆盖率阈值配置（全局 60%）与 README 声明的目标（85%+ 分支、90%+ 行）严重脱节，阈值形同虚设。同时，不可测代码（类型声明、re-export barrel files）拉低了整体覆盖率数字，掩盖了真正需要关注的覆盖缺口。需要建立分模块的分级阈值体系，并为未达标模块补充测试。

## What Changes

- 将 `vite.config.ts` 中的全局 60% 覆盖率阈值替换为按模块分级阈值
- 在 coverage exclude 中排除不可测代码（`src/@types/**`、纯 re-export 文件）
- 为 `config/initSteps.ts` 补充 execute 函数体和 modelProvider 错误路径测试（当前 31% → 目标 50%）
- 为 `store/storage/storeUtils.ts` 补充 saveToStore/loadFromStore 全路径测试（当前 0% → 拉升 store 整体）
- 为 `pages/Chat/index.tsx` 补充 chatId URL 重定向和条件渲染测试（当前 0%）
- 更新 `src/__test__/README.md` 中的覆盖率目标描述，与配置保持一致

## Capabilities

### New Capabilities
- `coverage-threshold-policy`: 分模块覆盖率阈值策略，定义各模块的目标覆盖率和排除规则

### Modified Capabilities

## Impact

- `vite.config.ts`：覆盖率配置变更
- `src/__test__/README.md`：覆盖率目标描述更新
- `src/__test__/config/initSteps.test.ts`：新增测试用例
- `src/__test__/store/storage/storeUtils.test.ts`：新增测试用例
- `src/__test__/pages/Chat/ChatPage.test.tsx`：新建测试文件
