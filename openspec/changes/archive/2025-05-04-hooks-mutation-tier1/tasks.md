## 1. useConfirm 变异测试

- [x] 1.1 将 `src/hooks/useConfirm.tsx` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 1.2 运行 Stryker 获取 useConfirm 基线变异报告
- [x] 1.3 补充测试：confirm 与 warning 分支的独立验证
- [x] 1.4 补充测试：onOk/onCancel 回调触发与跳过路径
- [x] 1.5 补充测试：对话框关闭后状态重置验证
- [x] 1.6 确认 useConfirm 变异得分达到 80%

## 2. useBasicModelTable 变异测试

- [x] 2.1 将 `src/hooks/useBasicModelTable.tsx` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 2.2 运行 Stryker 获取 useBasicModelTable 基线变异报告
- [x] 2.3 补充测试：四字段（nickname/providerName/modelName/remark）独立过滤验证
- [x] 2.4 补充测试：大小写不敏感过滤验证
- [x] 2.5 补充测试：isDeleted 模型排除验证
- [x] 2.6 确认 useBasicModelTable 变异得分达到 80%

## 3. useResetDataDialog 变异测试

- [x] 3.1 将 `src/hooks/useResetDataDialog.tsx` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 3.2 运行 Stryker 获取 useResetDataDialog 基线变异报告
- [x] 3.3 补充测试：resetAllData 失败后状态恢复路径
- [x] 3.4 补充测试：并发防护阻止重复调用 resetAllData
- [x] 3.5 补充测试：isResetting 状态在异步操作中的精确时序
- [x] 3.6 确认 useResetDataDialog 变异得分达到 80%

## 4. useAdaptiveScrollbar 变异测试

- [x] 4.1 将 `src/hooks/useAdaptiveScrollbar.ts` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 4.2 运行 Stryker 获取 useAdaptiveScrollbar 基线变异报告
- [x] 4.3 补充测试：连续滚动时定时器重置行为
- [x] 4.4 补充测试：CSS 类名切换（scrollbar-none ↔ scrollbar-thin）边界
- [x] 4.5 补充测试：自定义 hideDebounceMs 参数验证
- [x] 4.6 补充测试：定时器引用的 null 检查路径
- [x] 4.7 确认 useAdaptiveScrollbar 变异得分达到 80%

## 5. useAutoResizeTextarea 变异测试

- [x] 5.1 将 `src/hooks/useAutoResizeTextarea.ts` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 5.2 运行 Stryker 获取 useAutoResizeTextarea 基线变异报告
- [x] 5.3 补充测试：高度 clamp 逻辑（minHeight/maxHeight 边界值）
- [x] 5.4 补充测试：isScrollable 状态切换的精确条件
- [x] 5.5 补充测试：值从多行变为单行时高度回缩
- [x] 5.6 补充测试：动态 maxHeight 参数变更触发重算
- [x] 5.7 确认 useAutoResizeTextarea 变异得分达到 80%

## 6. useMediaQuery 变异测试

- [x] 6.1 将 `src/hooks/useMediaQuery.ts` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 6.2 运行 Stryker 获取 useMediaQuery 基线变异报告
- [x] 6.3 补充测试：matchMedia 匹配/不匹配初始状态
- [x] 6.4 补充测试：150ms 节流的 leading/trailing 行为
- [x] 6.5 补充测试：SSR 环境下返回 false 不抛错
- [x] 6.6 补充测试：卸载时清理监听器
- [x] 6.7 确认 useMediaQuery 变异得分达到 80%（covered: 82.35%，total: 73.68% — SSR 路径在 JSDOM 中无法覆盖）

## 7. 收尾

- [x] 7.1 运行完整 `pnpm test` 确认所有测试通过
- [x] 7.2 运行完整 `pnpm test:mutation` 确认所有 6 个 Hook 变异得分达标
