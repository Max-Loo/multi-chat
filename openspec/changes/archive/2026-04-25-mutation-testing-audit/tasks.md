## 1. 准备工作

- [x] 1.1 确认 `git status` 工作区干净，记录初始状态
- [x] 1.2 确认 `pnpm test:all --no-cache` 基线通过（所有测试绿色）
- [x] 1.3 读取 12 个变异目标的源码文件，确认变异点行号准确

## 2. 高信心变异执行（预期被捕获）

- [x] 2.1 M01: crypto.ts:162 — 边界检查 `<=` 改 `<`，运行 test:all，记录结果，还原
- [x] 2.2 M02: chatSlices.ts:370 — 删除 `name.trim() === ''` 检查，运行 test:all，记录结果，还原
- [x] 2.3 M03: useDebounce.ts:22 — 从 useEffect 依赖项移除 `delay`，运行 test:all，记录结果，还原
- [x] 2.4 M04: messageTransformer.ts:49 — 反转 `transmitHistoryReasoning` 条件（加 `!`），运行 test:all，记录结果，还原

## 3. 中信心变异执行（可能被捕获）

- [x] 3.1 M05: utils.ts:16 — `Math.floor` 改 `Math.ceil`，运行 test:all，记录结果，还原
- [x] 3.2 M06: chatSlices.ts:482 — 移除 `appendHistoryToModel` 失败时的 early return 守卫，运行 test:all，记录结果，还原
- [x] 3.3 M07: initSteps.ts:184 — 移除 `!modelProviderLoading &&` 中的 loading 守卫，运行 test:all，记录结果，还原

## 4. 低信心变异执行（疑似盲区）

- [x] 4.1 M08: messageTransformer.ts:53 — 移除 `reasoningContent.trim().length > 0` 中的 trim+length 检查，运行 test:all，记录结果，还原
- [x] 4.2 M09: storeUtils.ts:58 — `!data` 改 `data === null`，运行 test:all，记录结果，还原
- [x] 4.3 M10: storeUtils.ts:33 — 移除 `await store.save()` 调用，运行 test:all，记录结果，还原
- [x] 4.4 M11: initSteps.ts:80 — masterKey 步骤的 severity 从 `fatal` 改 `warning`，运行 test:all，记录结果，还原
- [x] 4.5 M12: i18n.ts:360 — 移除 `translated === safeKey` 条件检查，运行 test:all，记录结果，还原

## 5. 还原验证与报告生成

- [x] 5.1 执行 `git status` 和 `git diff` 确认所有源码文件已完全还原
- [x] 5.2 再次运行 `pnpm test:all --no-cache` 确认基线仍然通过
- [x] 5.3 生成变异测试报告：概览统计（杀死率、按信心等级分组）
- [x] 5.4 生成变异测试报告：逐变异详情（变异内容、测试结果、相关性分析）
- [x] 5.5 生成变异测试报告：盲区总结与测试改进建议
