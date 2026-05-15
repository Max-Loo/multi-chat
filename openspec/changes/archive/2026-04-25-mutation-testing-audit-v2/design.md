## Context

项目拥有约 120 个测试文件，覆盖 utils、crypto、components、services、store 等模块。测试体系遵循行为驱动原则，使用 Vitest + MSW + fake-indexeddb 基础设施。本次变异测试审计是一次性的质量评估活动，不改变任何生产代码。

## Goals / Non-Goals

**Goals:**
- 量化 6 个变异的杀灭率，评估测试套件对代码缺陷的捕获能力
- 识别测试盲区（存活的变异），提供改进建议
- 生成可追溯的 Markdown 报告

**Non-Goals:**
- 不自动化变异注入（手动逐个修改源码）
- 不引入 Stryker 等变异测试框架
- 不修改任何测试代码或生产代码（仅临时变异后还原）
- 不建立持续变异测试流程

## Decisions

### D1: 手动变异 vs 框架自动化

**选择**：手动注入 6 个预定义变异

**理由**：
- 6 个变异点已精心设计，覆盖不同缺陷类型，框架无法生成如此精准的变异
- 一次性审计活动，不值得引入 Stryker 的配置和维护成本
- 手动过程更可控，可以在报告中记录每个变异的设计思路

**备选方案**：使用 Stryker Mutator — 适合持续变异测试，但对一次性审计过重

### D2: 测试执行策略

**选择**：每个变异单独运行对应的测试文件（`vitest run <test-file>`），而非全部测试

**理由**：
- 6 个变异分散在 4 个测试文件中，针对性运行更高效
- 每个变异只需验证其对应的测试能否检测出问题
- 避免 `test:all`（含集成测试）的长时间等待

**变异与测试文件映射**：
```
M01 (getCurrentTimestamp)    → utils/utils.test.ts
M02 (getCurrentTimestampMs)  → utils/utils.test.ts
M03 (escapeHtmlManual)       → utils/htmlEscape.test.ts
M04 (isEncrypted)            → utils/crypto.test.ts
M05 (clearUrlSearchParams)   → utils/urlUtils.test.ts
M06 (hexToBytes)             → utils/crypto.test.ts
```

### D3: 还原策略

**选择**：每个变异测试后立即 `git checkout -- <file>` 还原

**理由**：
- 确保变异之间互不干扰
- 即使流程中断，也只需 `git checkout` 还原最后一个文件
- 流程结束后验证 `git status` 确认干净

### D4: 报告存放位置

**选择**：`docs/reports/mutation-testing-report.md`

**理由**：
- 符合项目 docs 目录规范
- reports 子目录可容纳未来的测试报告
- 不污染 openspec 或根目录

## Risks / Trade-offs

- **[6 个变异的代表性有限]** → 本审计仅为抽样评估，不代表全部测试质量。6 个变异的杀灭率是参考指标，非绝对评价
- **[手动操作可能出错]** → 每步验证 git status，确保变异正确注入和还原
- **[测试可能因环境波动而误判]** → 每个变异运行前确认基线测试通过
