# Mutation Testing Audit

## Purpose

变异测试审计系统：通过在源码中注入预定义变异、运行测试并记录结果，评估测试套件对代码缺陷的检测能力，最终生成审计报告。

## Requirements

### Requirement: 变异注入与还原

系统 SHALL 对 6 个预定义变异点逐个执行"注入变异 → 运行测试 → 记录结果 → 还原代码"的完整周期，每次仅修改一个源码文件。

#### Scenario: 单个变异的执行周期
- **WHEN** 对源码文件注入变异 M01
- **THEN** 系统 SHALL 运行对应的测试文件 `vitest run <test-file>`
- **THEN** 系统 SHALL 记录测试结果（通过/失败、失败的测试用例名）
- **THEN** 系统 SHALL 执行 `git checkout -- <file>` 还原源码文件
- **THEN** 系统 SHALL 验证 `git status` 确认还原成功

#### Scenario: 变异间互不干扰
- **WHEN** 变异 M01 执行完毕并还原
- **THEN** 系统 SHALL 确认 git 工作区干净后再开始 M02

### Requirement: 6 个预定义变异点

系统 SHALL 包含以下 6 个变异，每个变异 SHALL 包含目标文件、原始代码、变异代码和预期信心等级。

#### Scenario: 变异列表完整性
- **WHEN** 变异测试开始
- **THEN** 系统 SHALL 包含恰好 6 个变异（M01-M06）
- **THEN** 变异 SHALL 覆盖以下类型：算术错误(M01)、逻辑错误(M02)、安全漏洞(M03)、边界条件(M04)、副作用(M05)、条件反转(M06)

#### Scenario: M01 - 时间戳精度错误
- **WHEN** 注入变异 M01
- **THEN** `src/utils/utils.ts` 第 16 行 `Math.floor(Date.now() / 1000)` SHALL 变为 `Math.floor(Date.now() / 100)`
- **THEN** 预期信心等级 SHALL 为高

#### Scenario: M02 - 毫秒精度丢失
- **WHEN** 注入变异 M02
- **THEN** `src/utils/utils.ts` 第 29 行 `return Date.now()` SHALL 变为 `return Date.now() / 1000`
- **THEN** 预期信心等级 SHALL 为高

#### Scenario: M03 - XSS 防护缺失
- **WHEN** 注入变异 M03
- **THEN** `src/utils/htmlEscape.ts` 第 23 行 `'&': '&amp;',` SHALL 被移除
- **THEN** 预期信心等级 SHALL 为高（安全关键）

#### Scenario: M04 - 加密前缀判断宽松化
- **WHEN** 注入变异 M04
- **THEN** `src/utils/crypto.ts` 第 214 行 `value.startsWith("enc:")` SHALL 变为 `value.startsWith("enc")`
- **THEN** 预期信心等级 SHALL 为中

#### Scenario: M05 - URL 参数克隆缺失
- **WHEN** 注入变异 M05
- **THEN** `src/utils/urlUtils.ts` 第 21 行 `new URLSearchParams(searchParams)` SHALL 变为 `searchParams`
- **THEN** 预期信心等级 SHALL 为中

#### Scenario: M06 - hex 验证条件反转
- **WHEN** 注入变异 M06
- **THEN** `src/utils/crypto.ts` 第 25 行 `hex.length % 2 !== 0` SHALL 变为 `hex.length % 2 === 0`
- **THEN** 预期信心等级 SHALL 为高

### Requirement: 测试结果记录

系统 SHALL 对每个变异记录：变异编号、是否被杀死、失败的测试用例列表、相关性分析。

#### Scenario: 变异被杀死
- **WHEN** 变异 M01 引入后运行测试
- **THEN** 如果任何测试失败，系统 SHALL 记录为「已杀死」
- **THEN** 系统 SHALL 列出所有失败的测试文件和用例名称

#### Scenario: 变异存活
- **WHEN** 变异 M01 引入后运行测试
- **THEN** 如果所有测试通过，系统 SHALL 记录为「存活」
- **THEN** 系统 SHALL 标记对应的测试盲区

### Requirement: 变异测试报告生成

系统 SHALL 在所有变异执行完成后生成 `docs/reports/mutation-testing-report.md` 报告。

#### Scenario: 报告概览统计
- **WHEN** 报告生成
- **THEN** 报告 SHALL 包含：总变异数、被杀死数、存活数、杀死率
- **THEN** 报告 SHALL 按变异类型分组统计

#### Scenario: 报告逐变异详情
- **WHEN** 报告生成
- **THEN** 每个变异 SHALL 包含：编号、模块、变异描述、预期信心、实际结果、失败测试列表

#### Scenario: 盲区分析与改进建议
- **WHEN** 存活的变异存在
- **THEN** 报告 SHALL 分析存活原因
- **THEN** 报告 SHALL 提供具体的新增测试用例建议

### Requirement: 代码还原验证

系统 SHALL 确保所有变异在流程结束后完全还原。

#### Scenario: 全部还原验证
- **WHEN** 所有 6 个变异执行完毕
- **THEN** `git diff` SHALL 不包含任何源码文件的变更
- **THEN** `git status` SHALL 仅包含 openspec 相关和报告文件的新增
