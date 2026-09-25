# Design

## Context

测试套件现状：178 文件 / 约 48,000 行；基线全绿（单元 169 文件 2,391 用例、集成 9 文件 93 用例）；覆盖率阈值配置于 `vite.config.ts`（分模块，见 `coverage-threshold-policy` spec）。调研确认的冗余分布在三个层面：helpers 层死代码（约 320 行）、mock/工厂样板逐文件复制（约 600-800 行）、大文件内部重复用例与未参数化同构用例（10 个最大文件约 1,400-1,700 行）。冗余的主要来源是多轮 Stryker 变异测试补测后未清理旧用例（`chatSlices.test.ts` 中 36 个 describe 名含「精确覆盖/变异」字样）。动机见 proposal.md。

## Goals / Non-Goals

**Goals:**

- 精简冗余的同时保持测试全通过、各模块覆盖率不低于基线（行数量级为调研期估算；实施实测净精简 1,327 行——调研快照中的部分冗余已在此前迭代清理，按下方风险预案「不强行凑数」执行，验收以覆盖守恒与样板消除为准）
- 消除「同一 mock 体 / 同一工厂函数复制到多个文件」的模式，使新增测试只能走共享入口
- `chatSlices.test.ts` 从 3,189 行降至 2,600 行以下且用例按 thunk 可导航

**Non-Goals:**

- 不修改任何产品代码（`src/` 中 `__test__` 之外零改动）
- 不放松 `vite.config.ts` 覆盖率阈值，不调整 `vitest.integration.config.ts` 与 Stryker 配置
- 不合并 helpers 层并存的 `createTestStore` / `createTypeSafeTestStore` 两个入口名（13+28 文件各自稳定使用，改名收益低扰动大，留待后续）
- 不清理全部 250+ 主 specs 中的空壳 spec（仅修复与本变更直接相关的 `test-parameterization` 缺 Purpose 问题）；但被本变更删除/替换 API 直接牵连的 5 个 capability 经 delta 修正（见 D8），不属于本条豁免范围
- 不以 Stryker 变异分数作为本次验收指标（全量变异运行耗时过长，以 Istanbul 行/分支覆盖率守护）

## Decisions

### D1：按风险升序分四批实施，每批全量回归

批次顺序：① helpers 死代码删除（零引用，删除即完成）→ ② mock 样板收敛与本地工厂替换（含全局 setup 变更）→ ③ 同构用例参数化与重复用例删除 → ④ `chatSlices.test.ts` 结构化重构。

- 理由：死代码删除可机械验证（grep 零引用）；全局 mock 变更影响所有文件，必须独立成批以便失败定位；重复用例删除依赖「保留用例覆盖更完整」的人工判断，与纯机械的参数化分开；chatSlices 重构最复杂且依赖 ①②③ 建立的基础设施。
- 替代方案：一次性大提交——否决，review 困难、回归时无法二分定位。
- 每批完成后运行 `pnpm test:run && pnpm test:integration:run`，批次 ②③④ 追加 `pnpm test:coverage` 与基线对比。

### D2：i18n 全局 mock 采用「全局默认 + 文件级覆盖保留」策略

在 `setup/mocks.ts` 新增 `vi.mock('react-i18next', ...)`，默认行为与现有 `__mockI18n()` 纯默认调用等价（复用 `helpers/mocks/i18n.ts` 的工厂，遵循 `shared-mock-factories` 既有模式）。19 个纯默认样板文件的 `vi.mock` 声明整体删除；带自定义翻译键的约 41 个文件保留现有 `__mockI18n(自定义键)` 配置机制，不重写。

- 关键风险与探测：全局 `vi.mock` 会波及当前未 mock 该模块的其余文件（约 117 个）。合入后全量跑测，凡是依赖真实 `react-i18next` 行为而失败的文件，显式 `vi.unmock('react-i18next')` 并加 Mock 注释说明理由（符合 README 的 Mock 注释规范）。
- 替代方案：不提升全局、仅把 19 份样板各压缩为一行工厂调用——否决，样板仍在逐文件复制，与 spec「纯默认 mock MUST 全局提升」冲突。

### D3：重复用例删除采用「覆盖守恒」判定，变异标记用例保守处理

删除判定顺序：逐字重复 → 直接删其一；断言互相包含 → 保留断言更完整者；仅差输入值 → 不删除，改为 `it.each`。对带变异测试标记（如 `#94 杀死 find 条件变异`）的用例，删除前必须确认保留用例断言同一分支且输入域覆盖被删用例；无法确认时保留并在 design 之外的任务清单中记录。

- 理由：变异补测用例的意图是覆盖特定变异体，机械删除可能丢失唯一的分支覆盖点；「覆盖守恒」规则把风险收敛为可逐例检查的清单。
- 覆盖率兜底：批次 ③ 完成后若某模块覆盖率下降，即说明误删了独有覆盖用例，恢复该用例。

### D4：本地 store 工厂替换为 `createTypeSafeTestStore` + slice state 工厂组合

16 处内联 `createStore`/`createTestStore`/`createXxxStore` 改为共享工厂组合（`createChatSliceState`、`createChatPageSliceState` 等既有 state 工厂，19+ 文件已验证该模式可行）。两套集成测试与 performance 测试中的本地工厂一并处理。文件独用且语义特殊的构造（如 `createAutoNamingStore` 在 `chatMiddleware.test.ts` 内被复用 16 次）保留为文件内 helper，不上移。

- 理由：与 D3 同源的「覆盖守恒」思想——精简目标是消除复制，不是消灭文件内所有局部抽象；单文件高复用的 helper 本身不冗余。

### D5：`chatSlices.test.ts` 重构按「先提取、再删除、后归并」三步推进

步骤：(1) 提取 `seedChatWithModel(modelId, chatOverrides)` 与 `createTestStore(appConfigOverrides)`（消除 L1047、L1648 两处内联 reducer 字面量），不改任何用例；(2) 按 D3 删除约 35-45 个重复 it；(3) 按 thunk 归并 describe（sendMessage 18 组 → 1 组、setSelectedChatIdWithPreload 11 组 → 1 组），`it.each` 参数化 editChatName 截断等 4 组同构块。每步结束跑该文件测试再进入下一步。

- 理由：单文件 3,189 行的重构如果一步到位，失败时无法区分是提取错误、误删还是归并搬移错误；三步各自可独立验证与回滚。

### D6：fakeTimers 收敛到 describe 级，文件级与 it 内开关并存时优先 describe 级

`modelRemoteService.test.ts` 的 24 处手动 `vi.useFakeTimers()` 上提到所属 describe 的 `beforeEach`（配对 `afterEach` 恢复）；同文件确需真定时器的用例移入独立 describe。`resourceLoader.test.ts` 8 对 it 内开关、`InitializationManager.test.ts` 2 组重复的成对 setup 一并收敛。不上提到全局 setup——各文件定时器需求不一致，全局假定时器会破坏真定时器用例。

### D7：覆盖率基线以 json-summary 存档并机械对比

`vite.config.ts` 当前 reporter 为 `["text", "html", "json", "lcov"]`，其中 `json` 只产出逐文件 `coverage-final.json` 明细、不含模块汇总，需先追加 `"json-summary"`（产出 `coverage/coverage-summary.json`，不动阈值，符合 Non-Goals「不放松阈值」）。批次 ① 前运行 `pnpm test:coverage`，保存 `coverage/coverage-summary.json` 为基线副本；每批完成后重新生成并按模块对比 `lines`/`branches` 百分比，任何模块下降即阻塞该批合入。对比脚本可用一次性 node 脚本或人工比对分模块数字（模块数量少，人工比对即可，不引入持久化工具）。

### D8：被删/被替 API 牵连的主 specs 经 delta 修正，不直改主 specs 文件

本变更删除的导出（`useIsolatedTest`/`setTestEnv`/`verifyIsolation`/`createRunningChatEntry`/`createMockMatchMedia`）与替换的机制（`__createI18nMockReturn` → `__mockI18n` 全局默认 mock；setup 三层 → 四层）使 5 个主 spec 与实现矛盾（verify 阶段全仓扫描确认）。处理：在变更目录 `specs/` 下补充 delta——`test-environment-isolation`（REMOVED ×3）、`test-store-consolidation`（REMOVED ×2）、`unified-mock-helpers`（REMOVED ×1）、`i18n-mock-unification`（MODIFIED ×2）、`test-setup-layers`（MODIFIED ×3），归档 sync 时一并应用到主 specs。

- 理由：proposal 原声明「不修改任何既有 capability」在 API 删除后不再成立；OpenSpec 纪律要求 capability 变更经 delta 声明，且 delta 集中在变更目录内、可随变更整体评审与回滚。
- 替代方案：直改主 specs 文件——否决，绕过 delta 评审链路且丢失「变更 → spec」的对应记录；留待后续 spec 清理变更——否决，矛盾由本变更直接造成，随本变更消除。
- 备注：上述三份主 spec 历史遗留 delta 头（主 spec 内出现 `## ADDED/MODIFIED Requirements`），其 requirements 对 openspec 解析器不可见，archive 会拒绝应用 delta。已做仅限结构的修复（补标题/Purpose/`## Requirements` 节头，requirements 内容零改动，见任务 7.5），使 delta 可在归档时正常应用。

## Risks / Trade-offs

- [全局 i18n mock 波及未 mock 文件，隐性改变约 117 个文件的 i18n 行为] → D2 的 `vi.unmock` 显式恢复 + 全量回归；该批单独提交，可整体 revert。
- [误删唯一覆盖某分支的用例，覆盖率下降] → D3 覆盖守恒判定 + D7 每批覆盖率机械对比阻塞；变异标记用例默认保留。
- [`it.each` 合并后失败用例定位变难（一个参数化用例失败只报参数行）] → 参数表用例名列保留原用例语义（如 `V1: 100000 次迭代`）；接受此权衡，换取维护时同构逻辑只改一处。
- [chatSlices 重构搬移 describe 时丢失 beforeEach 上下文（该文件仅 1 个顶层 beforeEach，83 组 describe 依赖它）] → 归并仅在顶层 beforeEach 作用域内移动分组，不引入新的嵌套 beforeEach；每步全文件跑测。
- [删除 helpers 导出可能破坏未检索到的动态引用（字符串路径导入等）] → 删除前除 rg 外追加 `pnpm tsc` 验证类型层引用；本仓库测试无字符串动态导入 helpers 的先例。
- [净精简量不达标（估算 2,500-3,200 行，实际可能缩水）] → 每批统计 `git diff --stat` 行数；若批次 ③④ 完成后净精简低于 2,000 行，评估剩余次级热点（如 `i18n.test.ts` 43 处内联动态导入收敛）后再收尾，不强行凑数。【实施结果】该风险已发生：实测净精简 1,327 行；评估指定次级热点（`i18n.test.ts` 动态导入收敛约 -80 行）后确认无法补齐缺口，按预案收尾，tasks.md 各批次行数指标已按实测修订。

## Migration Plan

无部署迁移（纯测试代码变更）。回滚策略：四批各自独立提交（`test: 删除 helpers 死代码` / `test: mock 样板收敛` / `test: 参数化与去重` / `test: chatSlices 重构`），任一批回归失败 `git revert` 该批即可，批次间无前向依赖破坏（② 依赖 ① 删除的文件不再被引用，③④ 依赖 ② 的共享工厂，revert 需按逆序）。

【实施结果】分批独立提交未按原案执行：四个批次按序实施并逐批全量回归（回归记录见 tasks.md 2.5/3.9/4.7/5.4），但批次未各自成 commit，全部实现以单一评审分支的工作区变更形式存在（净精简统计见任务 6.3）。因此逐批 `git revert` 粒度不可用，回滚单位为整个变更；各批次净删行数已按实施时逐批 diff 统计回填 tasks.md（3.9、4.7）。
