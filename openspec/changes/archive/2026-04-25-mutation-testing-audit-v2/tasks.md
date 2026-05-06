## 1. 基线验证

- [x] 1.1 确认所有 4 个目标测试文件基线通过（`vitest run src/__test__/utils/utils.test.ts src/__test__/utils/htmlEscape.test.ts src/__test__/utils/crypto.test.ts src/__test__/utils/urlUtils.test.ts`）
- [x] 1.2 创建报告输出目录 `docs/reports/`

## 2. 变异测试执行（M01-M06）

- [x] 2.1 M01：修改 `src/utils/utils.ts` 第 16 行 `/1000` → `/100`，运行 `vitest run src/__test__/utils/utils.test.ts`，记录结果，`git checkout -- src/utils/utils.ts` 还原
- [x] 2.2 M02：修改 `src/utils/utils.ts` 第 29 行 `Date.now()` → `Date.now() / 1000`，运行 `vitest run src/__test__/utils/utils.test.ts`，记录结果，`git checkout -- src/utils/utils.ts` 还原
- [x] 2.3 M03：修改 `src/utils/htmlEscape.ts` 移除 `'&': '&amp;',` 行，运行 `vitest run src/__test__/utils/htmlEscape.test.ts`，记录结果，`git checkout -- src/utils/htmlEscape.ts` 还原
- [x] 2.4 M04：修改 `src/utils/crypto.ts` 第 214 行 `startsWith("enc:")` → `startsWith("enc")`，运行 `vitest run src/__test__/utils/crypto.test.ts`，记录结果，`git checkout -- src/utils/crypto.ts` 还原
- [x] 2.5 M05：修改 `src/utils/urlUtils.ts` 第 21 行 `new URLSearchParams(searchParams)` → `searchParams`，运行 `vitest run src/__test__/utils/urlUtils.test.ts`，记录结果，`git checkout -- src/utils/urlUtils.ts` 还原
- [x] 2.6 M06：修改 `src/utils/crypto.ts` 第 25 行 `hex.length % 2 !== 0` → `hex.length % 2 === 0`，运行 `vitest run src/__test__/utils/crypto.test.ts`，记录结果，`git checkout -- src/utils/crypto.ts` 还原

## 3. 报告生成

- [x] 3.1 汇总 6 个变异的测试结果，计算杀死率和存活率
- [x] 3.2 编写 `docs/reports/mutation-testing-report.md` 报告（含概览统计、逐变异详情、盲区分析、改进建议）

## 4. 还原验证

- [x] 4.1 验证 `git diff` 不包含任何源码文件变更
- [x] 4.2 验证 `git status` 仅包含 openspec 相关和报告文件的新增
