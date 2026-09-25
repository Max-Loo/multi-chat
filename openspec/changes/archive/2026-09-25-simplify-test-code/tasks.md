# Tasks

## 1. 基线存档（前置）

- [x] 1.1 在 `vite.config.ts` 的 `coverage.reporter` 数组追加 `"json-summary"`（当前 `json` 只产出 `coverage-final.json` 逐文件明细、无模块汇总；不动阈值），随后运行 `pnpm test:coverage` 并将 `coverage/coverage-summary.json` 复制为基线副本（如 `coverage/coverage-baseline.json`），记录 8 个分模块 + 全局底线的 lines/branches 数字（模块清单见 `vite.config.ts` thresholds）；验证：`coverage/coverage-summary.json` 生成且基线文件含各模块数据
- [x] 1.2 记录基线通过数（单元 169 文件 2,391 用例、集成 9 文件 93 用例）到变更目录备注；验证：数字与 `pnpm test:run` / `pnpm test:integration:run` 输出一致

## 2. 批次①：helpers 死代码删除

- [x] 2.1 删除 `src/__test__/helpers/mocks/matchMedia.ts` 整文件（63 行，0 引用）；验证：`rg "createMockMatchMedia|setupMatchMediaMock" src/` 零结果
- [x] 2.2 删除 `src/__test__/helpers/mocks/router.ts` 中零引用导出（`createMockSearchParams`、`createNestedRouteParams`、`createMockLocationWithQuery`、`createReactRouterMocksWithNestedParams`，约 L35-171），保留被 router/ 测试使用的 `getRootRoute`/`getRootChildren`/`hasRouteProperty`；验证：`rg "createMockSearchParams|createReactRouterMocksWithNestedParams" src/` 零结果且 router/ 4 个测试仍通过
- [x] 2.3 删除仅自测引用的导出：`testState.ts` 的 `createRunningChatEntry`、`helpers/fixtures/model.ts` 的 `createEncryptedModel`/`createKimiModel`、`helpers/fixtures/modelProvider.ts` 的 `createZhipuProvider`、`helpers/isolation/reset.ts` 的 `useIsolatedTest`/`setTestEnv`/`verifyIsolation`，同步删除其自测用例；验证：`pnpm test:run` 通过且 helpers 自测文件无失败
- [x] 2.4 删除 `helpers/integration/clearIndexedDB.ts` 壳文件（改由使用方直接导入 `helpers/isolation/reset.ts`）、移除 `setup/base.ts` 中零使用的 `__createI18nMockReturn` globalThis 注册；验证：`rg "clearIndexedDB" src/__test__/helpers/integration` 零结果、`pnpm tsc` 无类型错误
- [x] 2.5 批次①全量回归：`pnpm tsc && pnpm test:run && pnpm test:integration:run` 全部通过，`git diff --stat` 确认净删除约 320 行且未触碰产品代码

## 3. 批次②：mock 样板收敛与本地工厂替换

- [x] 3.1 在 `src/__test__/setup/mocks.ts` 新增 `vi.mock('react-i18next', ...)` 全局 mock（复用 `helpers/mocks/i18n.ts` 的 `__mockI18n` 工厂纯默认行为）；验证：新增后 `pnpm test:run` 运行完成，识别因全局 mock 失败的文件清单
- [x] 3.2 对 3.1 识别出的依赖真实 `react-i18next` 的失败文件，添加 `vi.unmock('react-i18next')` 与理由注释；验证：`pnpm test:run` 全部通过
- [x] 3.3 删除 19 个纯默认 i18n 样板文件的文件级 `vi.mock('react-i18next')` 声明（依赖全局 mock）；验证：`rg -l "vi.mock\('react-i18next'" src/__test__` 仅剩带自定义键的文件
- [x] 3.4 扩展 AI SDK 共享 mock 层：`helpers/mocks/aiSdk.ts` 新增 `createMockAISDKMetadata(overrides?)` 工厂（共享层当前无此导出；两文件本地版本互不相同——`streamProcessor` 版已支持 `Partial` overrides、`index.integration` 版为固定值，统一为 overrides 形态），并为 `createMockStreamResult` 增加 metadata 注入参数（兼容现有两参签名）；验证：`pnpm test:run && pnpm test:integration:run` 通过（新导出尚未被引用，行为零变化）
- [x] 3.5 替换 AI SDK mock 本地重写：`services/chat/streamProcessor.integration.test.ts`（L46、L83）与 `services/chat/index.integration.test.ts`（L48、L77）删除本地 `createMockAISDKMetadata`/`createMockStreamResult`，改从 `helpers/mocks/aiSdk.ts` 导入；两文件原默认值经 overrides 表达（注意共享默认 usage 为 10/5/15，`index.integration` 断言依赖 10/20/30，必须注入而非改断言）；验证：`pnpm test:integration:run` 通过且流式行为断言逐字不变
- [x] 3.6 替换 16 处内联 store 工厂（`components/ChatPanelSender.test.tsx:37`、`components/ChatPanelHeader.test.tsx:31`、`components/ModelConfigForm.test.tsx:28`、`components/ChatPanel.test.tsx:42`、`pages/Model/` 下 5 个、`integration/` 下 5 个、`performance/chat-button-render-count.test.tsx:18`、`pages/Chat/ChatPage.test.tsx:64`）为 `createTypeSafeTestStore` + slice state 工厂组合；验证：各文件测试通过且 `rg "const create\w*Store = " src/__test__` 仅剩共享层定义与文件内高复用 helper（如 `createAutoNamingStore`）
- [x] 3.7 收敛同构 mock 模板：`useNavigateToPage`（7 文件）、`sonner`（4 文件）、`virtua` 手写 V 组件（2 文件）改为共享工厂/globalThis 工厂单行引用；验证：各模板 mock 体在 `src/__test__` 中至多出现一次（共享定义处）
- [x] 3.8 清理与全局 setup 重复的样板：删除 12 个文件的手写 `vi.clearAllMocks()`、10 个文件的 `localStorage.clear()`（存储类三连清理统一用 `resetTestState()`）；验证：`rg -c "vi.clearAllMocks\(\)" src/__test__ --glob '!**/setup/**'` 仅剩语义必要处（如部分集成测试 setup）
- [x] 3.9 批次②全量回归：`pnpm test:run && pnpm test:integration:run && pnpm test:coverage` 通过 ✓，各模块覆盖率与 1.1 基线完全持平；`git diff --stat` 实测批次净精简 84 行（新增共享工厂约 200 行；调研中的内联工厂多数已在此前迭代重构为薄委托，按 design 风险预案不强行凑数）

## 4. 批次③：同构用例参数化与重复用例删除

- [x] 4.1 `utils/resourceLoader.test.ts:961-1059` 的 17 个连续 `isNetworkError` it 合并为 1 个 `it.each`；验证：该文件测试通过且用例数减少 16、参数表含全部 17 组输入
- [x] 4.2 `utils/crypto.test.ts:436-539` 的 12 个往返加密 it 合并为 `test.each`（对齐同文件 L413-431 正面样板），跨文件提取 `expectNonExtractableKeyDerivation` 共享 helper（crypto.test.ts L239-292 与 keyringMigration.test.ts L598-646 共 6 处同构断言）；验证：两文件测试通过、往返矩阵覆盖不变
- [x] 4.3 `utils/tauriCompat/keyringMigration.test.ts:576-668` 的 V1/V2 PBKDF2 参数 6 个 it 合并为 `it.each(['V1', 'V2'])`；验证：该文件测试通过且派生参数断言完整保留
- [x] 4.4 `services/modelRemoteService.test.ts`：`isRetryableError` 直接测 6 个 it（L565-593）参数化、删除与间接测重复的 404/5xx 断言（L444-463 与 L533-542 双份、L217-238/L425-442/L514-531 三份各留一份）、24 处手动 fakeTimers 开关上提到 describe 级；验证：文件测试通过、fakeTimers 开关对数下降至 describe 级 1 组
- [x] 4.5 `pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx`：删除 3 组逐字重复 it（L165-171≈L195-201、L203-210≈L228-235、L184-191≈L217-225）、4 种响应式模式 it 参数化（L266-337）；验证：文件测试通过、`rg "下拉菜单" 该文件` 每个断言仅出现一次
- [x] 4.6 其余参数化与去重：`services/lib/i18n.test.ts` 语言降级 toast 5 个 it（L398-486）、`services/lib/initialization/InitializationManager.test.ts` 交叉组合 2 个 it（L505-560）与重复 fakeTimers 对（L324/L831）、`store/middleware/chatMiddleware.test.ts` 自动命名不触发 3 个 it（L348-394）、`keyring.test.ts` isSupported 双重覆盖（L686-704≈L711-737）；验证：各文件测试通过
- [x] 4.7 批次③全量回归：`pnpm test:run && pnpm test:integration:run && pnpm test:coverage` 通过 ✓，各模块覆盖率与基线完全持平（无需恢复误删用例）；`git diff --stat` 实测批次③④合计净精简 847 行（批次未独立提交，按实施时逐批 diff 统计）

## 5. 批次④：chatSlices.test.ts 结构化重构

- [x] 5.1 提取公共构造（不改用例）：`seedChatWithModel(modelId, chatOverrides)` helper 消除「createMockChat + createMockModel + dispatch(createChat)」逐字重复（约 50 处）、`createTestStore` 参数化为 `createTestStore(appConfigOverrides)` 吸收 L1047-1053 与 L1648-1654 两处内联 reducer；验证：该文件测试全部通过、行数下降且无 it 增删
- [x] 5.2 按覆盖守恒判定删除重复用例（约 35-45 个）：sendMessage.fulfilled 三重覆盖（L788-809/L2260-2278/L2511-2525）、appendHistoryToModel 双重（L2237-2258≈L2490-2509）、startSendChatMessage 跳过双重（L1176-1204≈L1601-1641）、setSelectedChatIdWithPreload 四组 describe 重复断言、editChatName 5 组保留覆盖最全者、generateChatName.fulfilled 双重（L565-603≈L1872-1930）；变异标记用例无法确认时保留；验证：该文件测试通过、删除清单在提交说明中逐条列出
- [x] 5.3 归并 describe 与参数化：sendMessage 相关 18 组归并为 1 组、setSelectedChatIdWithPreload 11 组归并为 1 组、editChatName 截断 4 组 7 个 it 参数化为 1 个 `it.each`（L680-697/L1313-1326/L2199-2221/L2903-2932）、startSendChatMessage 跳过 3 it 与 chatData falsy 2 it 参数化；验证：该文件测试通过、describe 分组数明显下降（83 → 约 50）
- [x] 5.4 批次④全量回归：`pnpm test:run` 通过 ✓（用例数较 5.1 前减少数与删除清单一致：2,373 → 2,361）、store/ 模块覆盖率与基线完全持平 ✓、文件行数实测 2,805（原目标 2,600 基于过时快照；变异标记用例按 design D3 保守保留）

## 6. 收尾

- [x] 6.1 修复 `openspec/specs/test-parameterization/spec.md` 缺失 Purpose 段落的格式问题（`openspec show "test-parameterization" --type spec` 当前报错）；验证：该命令不再报 `Spec must have a Purpose section`
- [x] 6.2 更新 `src/__test__/README.md`：删除 matchMedia 引用、补充 react-i18next 全局 mock 与 `vi.unmock` 例外说明、store 工厂统一用法；验证：README 中无已删除 API 的引用（`rg "matchMedia" src/__test__/README.md` 零结果）
- [x] 6.3 最终验收：`pnpm test:run && pnpm test:integration:run && pnpm test:coverage` 全通过 ✓、各模块覆盖率与 1.1 基线完全持平 ✓、全变更净精简实测 1,327 行（`git diff main --stat -- src/__test__`：-3,410/+2,083，72 文件；调研估算 2,000-3,200 基于过时快照，部分冗余已在此前迭代清理）、产品代码零改动 ✓（`git diff main --stat -- 'src/**' ':!src/__test__'` 为空，仅 vite.config.ts 含 1.1 授权的 json-summary reporter 变更）

## 7. 主 specs 一致性修正（verify 阶段补充）

- [x] 7.1 全仓扫描被本变更删除/替换 API 牵连的主 specs，确认 5 个 capability 与实现矛盾：`test-environment-isolation`（useIsolatedTest/setTestEnv/verifyIsolation）、`test-store-consolidation`（createRunningChatEntry、RunningChatBubble 测试文件已不存在）、`unified-mock-helpers`（createMockMatchMedia）、`i18n-mock-unification`（__createI18nMockReturn）、`test-setup-layers`（__createI18nMockReturn 注册、setup 三层）；验证：rg 全仓命中仅剩变更归档与上述主 specs
- [x] 7.2 编写 REMOVED delta（test-environment-isolation ×3、test-store-consolidation ×2、unified-mock-helpers ×1，附 Reason/Migration）与 MODIFIED delta（i18n-mock-unification ×2、test-setup-layers ×3，提供完整替换文本）；验证：delta 的 Requirement 标题与主 spec 逐字一致
- [x] 7.3 同步修订 proposal（Modified Capabilities 列表、What Changes、Impact）与 design（Non-Goals 边界澄清、新增 D8 决策）；验证：proposal 不再声明「不修改任何既有 capability」
- [x] 7.4 校验变更产物：`openspec validate "simplify-test-code" --strict` 通过、`openspec status` 识别全部 specs 产物（6 个 capability delta，共 17 条）；验证：无格式或 schema 报错
- [x] 7.5 修复三份结构损坏的主 spec（test-store-consolidation、unified-mock-helpers、i18n-mock-unification）：历史遗留 delta 头使其 requirements 对解析器不可见、archive 拒绝应用本变更 delta；仅补标题/Purpose/`## Requirements` 节头，requirements 内容零改动；验证：`openspec show <cap> --type spec` 可解析、`git diff` 仅结构行新增
