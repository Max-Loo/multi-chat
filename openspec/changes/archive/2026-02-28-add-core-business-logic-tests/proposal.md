## Why

当前项目测试覆盖率仅42.55%，核心业务逻辑模块（chatSlices、chatService、modelSlice、appConfigSlices）共897行代码完全缺少单元测试，存在代码质量风险和维护困难。这些模块是应用的交互层、状态管理和核心服务，任何故障都会直接影响用户体验。现在添加测试可以及时保障代码质量，并为未来重构提供安全网。

## What Changes

- 为 `src/store/slices/chatSlices.ts`（434行）添加完整的单元测试，覆盖聊天列表初始化、消息发送、状态管理等核心业务逻辑
- 为 `src/services/chatService.ts`（260行）添加单元测试，验证流式聊天请求、消息格式转换、错误处理等关键功能
- 为 `src/store/slices/modelSlice.ts`（119行）添加单元测试，测试模型初始化、增删改查及软删除逻辑
- 为 `src/store/slices/appConfigSlices.ts`（84行）添加单元测试，覆盖应用配置初始化和语言切换功能
- 新增测试文件使用项目现有的测试辅助工具（`src/__test__/helpers/`）和测试模式
- 不修改任何生产代码，仅添加测试文件

## Capabilities

### New Capabilities
- `chat-slices-testing`: 测试聊天状态管理的 Redux slice，包括聊天列表初始化、多模型消息发送、运行状态管理等核心交互逻辑
- `chat-service-testing`: 测试流式聊天服务，包括供应商 provider 获取、异步生成器流式响应、消息格式转换、Token 使用统计等功能
- `model-slice-testing`: 测试模型管理的 Redux slice，包括模型初始化、创建、编辑、删除及软删除逻辑
- `app-config-slices-testing`: 测试应用配置的 Redux slice，包括语言初始化、推理内容开关状态管理、localStorage 持久化

### Modified Capabilities
无（不修改现有功能规范，仅添加测试）

## Impact

**新增文件**：
- `src/__test__/store/slices/chatSlices.test.ts`
- `src/__test__/services/chatService.test.ts`
- `src/__test__/store/slices/modelSlice.test.ts`
- `src/__test__/store/slices/appConfigSlices.test.ts`

**受影响的代码**：
- 无（仅添加测试文件，不修改生产代码）

**依赖关系**：
- 使用现有测试框架：Vitest + React Testing Library
- 使用现有测试辅助工具：`@/test-helpers`（Mock 工厂、测试数据工厂、自定义断言等）
- 遵循现有测试模式：参考 `modelProviderSlice.test.ts`、`chatMiddleware.test.ts` 等

**预期成果**：
- 核心业务逻辑测试覆盖率达到 90%+
- 整体测试覆盖率从 42.55% 提升至 70%+
- 为未来重构和功能扩展提供测试保障
- 提升代码可维护性和团队信心
