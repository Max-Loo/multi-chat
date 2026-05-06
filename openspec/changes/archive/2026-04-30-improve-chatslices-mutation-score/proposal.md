## Why

chatSlices.ts 的 Stryker 变异测试得分仅 56.93%，远低于 80% 的高质量阈值，且有 32 个变异体完全没有测试覆盖（NoCoverage）。这意味着近一半的代码变异无法被现有测试检测，存在逻辑回归风险。当前是项目引入变异测试基础设施后的第一个迭代，应趁热打铁建立测试质量基线。

## What Changes

- 补充 4 个未覆盖代码路径的单元测试：`initializeChatList` fulfilled 中的 filter 逻辑（L64）、`setSelectedChatIdWithPreload` 内部预加载逻辑（L168-L197）、`pushRunningChatHistory` reducer（L473-L485）、`setChatMetaList`（L349-L351）
- 为 34 个条件表达式存活变异（ConditionalExpression survived）补充反向分支测试用例，确保每个 `if/else` 都有真/假两条路径的断言
- 精确化 25 个对象字面量和代码块存活变异（ObjectLiteral/BlockStatement survived）对应的断言，从宽泛的 `toMatchObject` / `toBeDefined` 改为逐字段 `toEqual` 验证
- 移除 proposal 中关于 `related: true` 的错误描述（经审查确认该配置不影响本变更）

## Capabilities

### New Capabilities

- `chatslices-mutation-coverage`: chatSlices.ts 变异测试覆盖率提升，包含未覆盖分支补充、条件表达式反向测试、state 断言精确化

### Modified Capabilities

（无）

## Impact

- **测试文件**: `src/__test__/store/slices/chatSlices.test.ts` — 新增约 30-40 个测试用例
- **配置文件**: `stryker.config.json` — 可能需要调整超时配置
- **构建时间**: 变异测试运行时间可能增加 1-2 分钟（因测试用例数量增加）
- **CI/CD**: 无影响，变异测试不在 CI 流水线中运行
