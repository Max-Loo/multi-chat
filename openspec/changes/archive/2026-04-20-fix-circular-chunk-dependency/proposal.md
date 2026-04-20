## Why

`vite.config.ts` 的 `manualChunks` 配置将初始化相关模块拆分为 `chunk-init` 和 `chunk-initsteps` 两个 chunk，但 `FatalErrorScreen`（chunk-init）与 `initSteps`（chunk-initsteps）之间存在双向依赖，导致构建时出现循环 chunk 报错，运行时出现 TDZ（暂时性死区）错误。

## What Changes

- 合并 `chunk-init` 和 `chunk-initsteps` 为单一的 `chunk-init`，消除循环依赖
- 移除已失效的 `lib/initialization` 匹配规则（当前代码库中无匹配模块）

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `progressive-loading`：移除 `chunk-initsteps` 独立打包要求，将 initSteps 并入 `chunk-init`（因 FatalErrorScreen 与 initSteps 的双向依赖导致循环 chunk，无法保持独立打包）

## Impact

- **构建配置**：`vite.config.ts` 的 `manualChunks` 函数
- **产物变化**：原 `chunk-initsteps` 的模块合入 `chunk-init`，chunk-init 体积略有增加（约 10KB gzip）
- **无功能影响**：不改变任何运行时行为或用户界面
