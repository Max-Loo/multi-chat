# 核心业务逻辑测试技术设计

## Context

### 背景
当前项目是一个 Tauri + React + TypeScript 桌面应用，整体测试覆盖率为 42.55%。核心业务逻辑模块（chatSlices、chatService、modelSlice、appConfigSlices）共 897 行代码完全缺少单元测试。这些模块处于应用的交互层、状态管理和核心服务层，任何故障都会直接影响用户体验。

### 当前状态
- **测试框架**：Vitest + React Testing Library + Testing Library Extras
- **测试辅助工具**：已建立完善的测试辅助工具体系（Mock 工厂、测试数据工厂、自定义断言、环境隔离等）
- **现有测试模式**：已有关 UI 组件、其他 Redux slices、中间件、服务层和工具函数的测试可参考
- **CI/CD**：项目配置了 `pnpm test` 和 `pnpm test:coverage` 命令

### 约束
- **不修改生产代码**：仅添加测试文件，不修改 `src/` 下的业务逻辑代码
- **遵循现有模式**：使用项目已有的测试模式和辅助工具
- **覆盖率目标**：核心业务逻辑测试覆盖率达到 90%+，整体覆盖率提升至 70%+
- **测试环境**：使用 happy-dom 作为 DOM 环境，支持 Tauri API Mock

### 相关方
- **开发团队**：需要测试文档和可维护的测试代码
- **未来维护者**：需要清晰的测试用例和文档说明业务逻辑
- **用户**：间接受益于更稳定的代码质量和更少的 bug

## Goals / Non-Goals

**Goals:**
- 为 4 个核心业务逻辑模块添加全面的单元测试，覆盖关键路径和边界情况
- 建立可重复执行的测试用例，确保测试的稳定性和可维护性
- 遵循 SOLID 原则编写测试，确保测试代码的高内聚、低耦合
- 达到 90%+ 的模块级测试覆盖率，提升整体覆盖率至 70%+
- 为未来重构和功能扩展提供测试保障

**Non-Goals:**
- 不添加 E2E 测试或集成测试（已有其他测试覆盖）
- 不修改生产代码以提升可测试性（如有需要，单独创建变更）
- 不测试第三方库（如 @ai-sdk/*、Redux Toolkit）
- 不测试 UI 组件（已有组件测试覆盖）
- 不添加性能测试或负载测试

## Decisions

### 1. 测试文件组织结构

**决策**：按源文件路径组织测试文件，保持一致性

**理由**：
- 项目已有测试文件按此模式组织（`src/__test__/<module-path>/<filename>.test.ts`）
- 便于查找和维护
- 与现有项目结构一致

**实施**：
```
src/__test__/store/slices/chatSlices.test.ts
src/__test__/services/chatService.test.ts
src/__test__/store/slices/modelSlice.test.ts
src/__test__/store/slices/appConfigSlices.test.ts
```

### 2. Redux Slice 测试策略

**决策**：使用 Redux Toolkit 的 `createSlice` 和 `createAsyncThunk` 最佳实践

**理由**：
- Redux Toolkit 提供了良好的测试支持
- 可以直接测试 reducers 和 async thunks
- 无需完整渲染 React 组件

**实施**：
- **Reducers 测试**：直接调用 slice reducer 函数，验证状态转换
- **Async Thunks 测试**：使用 `createThunk` 的 dispatch 机制，Mock 异步操作
- **选择器测试**：验证选择器返回正确的状态切片
- **状态验证**：使用 Vitest 的 `expect().toEqual()` 进行深度比较

**参考**：现有测试 `modelProviderSlice.test.ts`、`chatMiddleware.test.ts`

### 3. 异步服务测试策略

**决策**：使用 Mock 和 Stub 隔离外部依赖，专注于业务逻辑

**理由**：
- `chatService.ts` 依赖 Vercel AI SDK（`ai` 包）和供应商 SDK
- 需要隔离网络请求和供应商 SDK 调用
- 测试应聚焦于消息格式转换、流式响应处理、错误处理等业务逻辑

**实施**：
- **Mock Vercel AI SDK**：使用 `vi.mock()` Mock `streamText`、`generateId` 等函数
- **Mock 供应商 SDK**：Mock `createDeepSeek`、`createMoonshotAI`、`createZhipu`
- **Mock fetch**：使用项目已有的 `@/__mock__/tauriCompat/http.ts` Mock
- **异步生成器测试**：使用 `for await...of` 循环测试流式响应
- **信号测试**：使用 `AbortController` 测试中断逻辑

**关键测试场景**：
- Provider 创建和配置
- 消息格式转换（system/user/assistant）
- 流式响应迭代（text-delta、reasoning-delta）
- Token 使用统计
- AbortSignal 中断
- 错误处理和传播

### 4. Mock 策略和数据管理

**决策**：使用项目现有的 Mock 工厂和测试数据工厂

**理由**：
- 项目已建立完善的测试辅助工具体系
- 避免重复代码，提升可维护性
- 统一的 Mock 策略确保测试一致性

**实施**：
```typescript
// 使用现有 Mock 工厂
import {
  createTauriMocks,
  createCryptoMocks,
  createStorageMocks,
} from "@/test-helpers";

// 使用测试数据工厂
import {
  createMockModel,
  createMockChat,
  createMockModels,
  createCryptoTestData,
} from "@/test-helpers";
```

**优势**：
- 标准化的 Mock 创建
- 可复用的测试数据
- 统一的断言和验证

### 5. 测试隔离和环境管理

**决策**：使用 `beforeEach` 和 `afterEach` 钩子确保测试隔离

**理由**：
- Redux store 状态会累积，需要每个测试前重置
- Mock 调用计数和状态需要清理
- 遵循项目现有的测试隔离模式

**实施**：
```typescript
import { resetTestState, useIsolatedTest } from "@/test-helpers";

describe("chatSlices", () => {
  useIsolatedTest({
    onBeforeEach: () => {
      // 自定义初始化
      vi.clearAllMocks();
    },
    onAfterEach: () => {
      // 自定义清理
    },
  });

  // 测试用例...
});
```

### 6. 覆盖率目标和验证

**决策**：使用 Vitest 的覆盖率报告验证测试完整性

**理由**：
- 量化测试覆盖情况
- 识别未测试的代码路径
- 项目已配置覆盖率报告（`pnpm test:coverage`）

**实施**：
- **语句覆盖率**：目标 90%+（核心业务逻辑）
- **分支覆盖率**：目标 85%+
- **函数覆盖率**：目标 100%（所有导出函数）
- **行覆盖率**：目标 90%+

**验证命令**：
```bash
pnpm test:coverage -- chatSlices.test.ts
pnpm test:coverage -- chatService.test.ts
```

### 7. 测试编写原则

**决策**：遵循 SOLID 原则和测试最佳实践

**理由**：
- 确保测试代码的可维护性和可读性
- 避免脆弱的测试（过度依赖实现细节）
- 聚焦于行为和契约

**实施**：
- **单一职责**：每个测试用例只验证一个行为
- **清晰的命名**：使用 `describe` 和 `test` 清晰描述测试场景
- **AAA 模式**：Arrange（准备）→ Act（执行）→ Assert（断言）
- **避免过度 Mock**：只 Mock 外部依赖，不 Mock 被测单元
- **测试边界情况**：包括空值、错误输入、极限值等

## Risks / Trade-offs

### 风险 1：Vercel AI SDK Mock 复杂度
**描述**：`chatService.test.ts` 需要深度 Mock Vercel AI SDK 的 `streamText` 和异步生成器，Mock 设置可能较复杂。

**缓解措施**：
- 使用 `vi.mock()` 在文件顶层 Mock SDK
- 创建简化的流式响应数据用于测试
- 将 Mock 逻辑封装为测试辅助函数

### 风险 2：Redux 状态累积影响测试
**描述**：Redux store 状态在多个测试间可能累积，导致测试相互影响。

**缓解措施**：
- 使用 `beforeEach` 钩子重置 store 状态
- 使用 `resetTestState()` 辅助函数
- 每个测试创建独立的 store 实例

### 风险 3：异步测试的不稳定性
**描述**：涉及网络请求、流式响应的异步测试可能不稳定（flaky）。

**缓解措施**：
- 使用 `fakeTimers` 控制时间
- 正确使用 `async/await` 和 `waitFor`
- Mock 所有异步操作，避免真实网络请求
- 设置合理的超时时间

### 风险 4：测试覆盖率的虚假提升
**描述**：仅追求覆盖率数字，忽略测试质量和关键场景。

**缓解措施**：
- 定义清晰的测试规范（specs），每个需求至少一个测试场景
- 进行代码审查，确保测试有意义
- 聚焦于关键业务路径和边界情况
- 定期审查测试用例，移除无效测试

### 权衡 1：测试粒度 vs 维护成本
**描述**：过度细致的测试会增加维护成本，但能更早发现问题。

**权衡**：
- 聚焦于公共 API 和关键业务逻辑
- 减少对私有函数的测试
- 优先测试用户可见的行为

### 权衡 2：Mock 程度 vs 测试真实性
**描述**：过度 Mock 会降低测试的真实性，但真实依赖会降低测试速度和稳定性。

**权衡**：
- Mock 外部依赖（网络、供应商 SDK）
- 不 Mock 被测单元内部逻辑
- 使用真实的 Redux store（但 Mock 异步操作）

## Migration Plan

### 实施步骤

1. **阶段 1：Redux Slices 测试**（优先级：高）
   - [ ] 创建 `chatSlices.test.ts`
   - [ ] 创建 `modelSlice.test.ts`
   - [ ] 创建 `appConfigSlices.test.ts`
   - [ ] 运行测试验证通过
   - [ ] 检查覆盖率报告

2. **阶段 2：服务层测试**（优先级：高）
   - [ ] 创建 `chatService.test.ts`
   - [ ] Mock Vercel AI SDK 和供应商 SDK
   - [ ] 测试流式响应处理
   - [ ] 测试错误处理和中断逻辑
   - [ ] 运行测试验证通过
   - [ ] 检查覆盖率报告

3. **阶段 3：集成验证**（优先级：中）
   - [ ] 运行全部测试套件
   - [ ] 生成覆盖率报告
   - [ ] 验证覆盖率目标达成
   - [ ] 修复失败的测试

4. **阶段 4：文档和审查**（优先级：低）
   - [ ] 更新 AGENTS.md 测试覆盖率数据
   - [ ] 代码审查测试文件
   - [ ] 合并到主分支

### 回滚策略
- 所有测试文件都是新增的，删除即可回滚
- 不影响生产代码，零风险

### 部署计划
- 添加测试文件不改变应用行为，无需特殊部署
- 测试在 CI/CD 中自动运行
- 覆盖率报告作为质量门禁

## Open Questions

1. **Q**: Vercel AI SDK 的 Mock 策略是否需要更新？
   - **A**: 当前 Mock 策略已在项目中验证，可复用。如有需要，在实施中调整。

2. **Q**: 是否需要测试 Redux slice 的不可变性（immer）？
   - **A**: Redux Toolkit 已保证不可变性，无需显式测试。聚焦于业务逻辑验证。

3. **Q**: 流式响应测试是否需要真实网络请求？
   - **A**: 否，使用 Mock 模拟流式响应，确保测试快速和稳定。

4. **Q**: 测试文件是否需要并发控制？
   - **A**: Vitest 默认并发运行测试，每个测试独立，无需额外控制。
