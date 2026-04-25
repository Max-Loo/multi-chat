## Why

项目已建立完善的测试体系（约 120 个测试文件、行为驱动原则、MSW mock 策略），但缺乏对测试质量的量化评估。变异测试审计通过向源码注入 6 个精心设计的缺陷，验证测试套件能否有效捕获，从而量化测试的"杀虫能力"并识别盲区。

## What Changes

- 在 5 个工具模块中注入 6 个代码变异（覆盖算术错误、安全漏洞、边界条件、副作用、条件反转），逐个运行测试并记录结果
- 生成 Markdown 格式的变异测试报告，包含概览统计、逐变异详情、盲区分析和改进建议
- 流程结束后还原所有代码变更，确保 git 状态干净

### 6 个变异点

| # | 模块 | 变异类型 | 风险 |
|---|------|---------|------|
| M01 | `getCurrentTimestamp` | 算术错误：`/1000` → `/100` | 高 |
| M02 | `getCurrentTimestampMs` | 逻辑错误：`Date.now()` → `Date.now()/1000` | 高 |
| M03 | `escapeHtmlManual` | 安全漏洞：移除 `&` 的转义 | 严重 |
| M04 | `isEncrypted` | 边界条件：`"enc:"` → `"enc"` | 中 |
| M05 | `clearUrlSearchParams` | 副作用：不克隆直接修改原对象 | 中 |
| M06 | `hexToBytes` | 条件反转：偶数长度检查反转为奇数检查 | 高 |

## Capabilities

### New Capabilities

- `mutation-testing-audit`: 变异测试审计的完整执行流程，包含变异注入、测试执行、结果记录、报告生成和代码还原

### Modified Capabilities

（无现有能力的需求变更，本次仅为审计性质的一次性活动）

## Impact

- **涉及源文件**（临时修改，执行后还原）：
  - `src/utils/utils.ts`（M01、M02）
  - `src/utils/htmlEscape.ts`（M03）
  - `src/utils/crypto.ts`（M04、M06）
  - `src/utils/urlUtils.ts`（M05）
- **涉及测试文件**（只读运行）：
  - `src/__test__/utils/utils.test.ts`
  - `src/__test__/utils/htmlEscape.test.ts`
  - `src/__test__/utils/crypto.test.ts`
  - `src/__test__/utils/urlUtils.test.ts`
- **产出物**：`docs/reports/mutation-testing-report.md`（测试质量报告）
- **无生产代码变更**：所有变异均为临时注入，流程结束后通过 `git checkout` 还原
