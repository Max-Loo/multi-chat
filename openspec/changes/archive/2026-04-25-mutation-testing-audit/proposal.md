## Why

项目拥有 159 个单元测试文件和 10 个集成测试文件，但测试的**缺陷捕获能力**从未被系统验证过。代码覆盖率数字只衡量了「哪些代码被执行过」，不能回答「测试能否发现真正的 bug」。通过变异测试（Mutation Testing），在 8 个核心模块中引入 12 个隐蔽的逻辑错误，可以量化测试套件的实际缺陷检测率，并暴露测试盲区。

## What Changes

- 在 8 个源码模块中逐一引入 12 个预定义的隐蔽逻辑变异（如 off-by-one、条件反转、边界检查缺失、闭包陷阱等）
- 每次变异后运行 `pnpm test:all --no-cache`，记录测试结果
- 生成变异测试报告，包含杀死率统计和盲区分析
- 所有变异在报告完成后还原，不留下任何代码变更

变异目标覆盖：
- `utils.ts` — 时间戳精度变异
- `crypto.ts` — 边界检查变异
- `chatSlices.ts` — trim 检查移除 / append 守卫移除
- `useDebounce.ts` — React 依赖项变异
- `messageTransformer.ts` — 推理开关反转 / 空串检查移除
- `storeUtils.ts` — falsy 检查变更 / save() 调用移除
- `initSteps.ts` — 严重级别篡改 / loading 守卫移除
- `i18n.ts` — tSafely key 匹配移除

## Capabilities

### New Capabilities
- `mutation-test-audit`: 变异测试审计流程的定义，包含变异策略、执行流程、报告格式和盲区分析方法

### Modified Capabilities
<!-- 无需修改现有规格，本次变更只涉及临时代码修改和报告生成，不影响任何生产代码 -->

## Impact

- **临时影响**：8 个源码文件会被短暂修改（每次只修改一个），测试运行后会立即还原
- **报告产出**：一份 Markdown 格式的变异测试报告，记录杀死率和盲区建议
- **无持久影响**：所有代码变更在流程结束后通过 `git checkout` 还原
- **无依赖变更**：不需要安装任何新的 npm 包或工具
