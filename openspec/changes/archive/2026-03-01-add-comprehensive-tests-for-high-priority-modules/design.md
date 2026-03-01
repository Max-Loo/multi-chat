# Design: 高优先级模块测试补充技术设计

## Context

### 当前状态
- **测试框架**: Vitest + React Testing Library + Happy DOM
- **测试覆盖率**: 56.12%（整体），核心业务逻辑模块 0%
- **现有测试辅助工具**: `src/__test__/helpers/` 包含 Mock 工厂、fixtures、断言、性能测试工具
- **项目结构**: Tauri + React + TypeScript，使用 Redux Toolkit 状态管理

### 约束条件
- 不能修改现有业务逻辑（仅添加测试）
- 必须使用现有测试框架和辅助工具
- 测试必须独立可运行，不依赖特定执行顺序
- 需要兼容 CI/CD 环境（资源限制）

### 相关方
- **开发团队**: 需要清晰的测试示例和文档
- **QA 团队**: 需要可靠的测试用例验证功能
- **产品团队**: 期望测试覆盖降低回归风险

## Goals / Non-Goals

**Goals:**
- 为 4 个高优先级模块添加 90%+ 的测试覆盖率
- 扩展现有测试辅助工具以支持新测试场景
- 提供清晰的测试文档和维护指南
- 确保所有测试在 CI/CD 环境中稳定运行

**Non-Goals:**
- 修改现有业务逻辑或组件实现
- 引入新的测试框架或工具
- 重构现有代码以提升可测试性（仅作为副作用）
- 达到 100% 测试覆盖率（目标 90%）

## Decisions

### 1. 测试架构分层

**决策**: 采用三层测试架构（单元测试、组件测试、集成测试）

**理由**:
- **单元测试**: 测试独立的 Hooks 和工具函数（快速、隔离）
- **组件测试**: 测试组件交互和渲染（中等速度、用户视角）
- **集成测试**: 测试跨组件交互和 Redux 流程（较慢、端到端验证）

**替代方案**:
- *仅组件测试*: 无法充分测试 Hooks 和复杂逻辑
- *仅单元测试*: 无法验证组件集成和用户交互

### 2. Mock 策略

**决策**: 扩展现有 Mock 工厂，使用分层 Mock 方法

**理由**:
- **Redux Mock**: 使用 `createReduxStoreMock()` 模拟完整 store
- **Tauri API Mock**: 继续使用 `createTauriMocks()` 兼容层
- **Navigation Mock**: 扩展 `mockRouter()` 支持嵌套路由
- **组件 Mock**: 使用 MSW (Mock Service Worker) 拦截 HTTP 请求

**实现**:
```typescript
// src/__test__/helpers/mocks/chatPanel.ts
export const createChatPanelMocks = () => ({
  reduxStore: createReduxStoreMock(),
  router: mockRouter(),
  tauri: createTauriMocks({ isTauri: false }),
  chatService: mockChatService(),
})
```

### 3. 测试数据管理

**决策**: 使用 Fixtures 模式管理测试数据

**理由**:
- 集中管理测试数据，避免重复
- 支持数据变体（valid/invalid/edge cases）
- 易于维护和更新

**实现**:
```typescript
// src/__test__/fixtures/chatPanel.ts
export const mockChatMessage = (overrides?: Partial<ChatMessage>) => ({
  id: 'test-msg-1',
  role: 'user',
  content: 'Test message',
  timestamp: Date.now() / 1000,
  ...overrides,
})
```

### 4. 异步测试策略

**决策**: 使用 `waitFor` + `findBy*` 查询处理异步操作

**理由**:
- ChatPanelSender 包含复杂的异步状态转换（发送中 → 完成/错误）
- React Testing Library 的异步工具已成熟稳定
- 避免使用 `setTimeout` 的不可靠等待

**实现示例**:
```typescript
await waitFor(() => {
  expect(screen.getByText('发送中')).toBeInTheDocument()
})
```

### 5. Safari Bug 测试方法

**决策**: 使用 JSDOM 的 `userAgent` 模拟 + 条件分支测试

**理由**:
- ChatPanelSender 包含 macOS Safari 特殊处理（中文输入法 bug）
- 无法在真实浏览器中运行测试（Happy DOM 环境）
- 通过修改 `navigator.userAgent` 模拟 Safari 环境

**实现**:
```typescript
const originalUA = navigator.userAgent
beforeEach(() => {
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    configurable: true,
  })
})
afterEach(() => {
  Object.defineProperty(navigator, 'userAgent', {
    value: originalUA,
  })
})
```

## Risks / Trade-offs

### Risk 1: 测试执行时间过长
**描述**: 新增 15-20 个测试文件可能导致 CI/CD 时间增加 3-5 分钟

**缓解措施**:
- 使用 `describe.concurrent()` 并行运行独立测试
- 对慢速测试标记 `@slow`，允许在快速验证模式下跳过
- 优化 Mock 数据和 fixture 创建

### Risk 2: Mock 复杂度增加
**描述**: 为复杂组件（ChatPanelSender）创建 Mock 可能过于复杂

**缓解措施**:
- 优先使用真实组件而非 Mock（组件测试原则）
- 仅 Mock 外部依赖（API、Store）
- 提供清晰的 Mock 文档和使用示例

### Risk 3: 测试脆弱性
**描述**: 过度依赖实现细节的测试容易在重构时失败

**缓解措施**:
- 遵循 "Black Box" 测试原则（测试用户可见行为）
- 使用 `data-testid` 属性而非 CSS 选择器
- 定期审查和维护测试用例

### Risk 4: Redux 状态复杂性
**描述**: ModelConfigForm 依赖复杂的 Redux 状态，难以模拟

**缓解措施**:
- 使用 `createReduxStoreMock()` 提供预配置状态
- 为表单测试创建专用的 Redux fixture
- 测试表单验证而非状态管理逻辑

## Migration Plan

### Phase 1: 基础设施准备（1-2 天）
1. 扩展 Mock 工厂和 fixtures
2. 创建测试辅助工具（`src/__test__/helpers/`）
3. 配置测试并行执行

### Phase 2: Hooks 和工具函数测试（2-3 天）
1. `useIsChatSending.test.ts`
2. `useTypedSelectedChat.test.ts`

### Phase 3: Chat Panel 组件测试（3-4 天）
1. `ChatPanel.test.tsx`
2. `ChatPanelContent.test.tsx`
3. `ChatPanelSender.test.tsx`（重点）
4. `ChatBubble.test.tsx`
5. `RunningChatBubble.test.tsx`

### Phase 4: Model 管理测试（3-4 天）
1. `ModelConfigForm.test.tsx`
2. `ModelTable.test.tsx`
3. `CreateModel.test.tsx`
4. `EditModelModal.test.tsx`

### Phase 5: Chat Sidebar 测试（2-3 天）
1. `ChatButton.test.tsx`
2. `ToolsBar.test.tsx`

### Phase 6: 文档和优化（1-2 天）
1. 更新 AGENTS.md
2. 性能优化和并行配置
3. CI/CD 集成验证

**总工期**: 12-18 天

**回滚策略**:
- 每个 Phase 独立提交，可随时回滚
- 测试代码不影响生产代码
- 如测试失败率过高，可暂时标记为 `@skip`

## Open Questions

1. **Q**: 是否需要为 ChatPanelSender 的 Safari bug 添加集成测试？
   - **A**: 已在单元测试中覆盖，无需额外集成测试

2. **Q**: ModelConfigForm 的 TanStack Form 测试是否需要特殊处理？
   - **A**: 使用 TanStack Form 的 `render` prop 模式，测试通过事件触发

3. **Q**: CI/CD 超时时间是否需要调整？
   - **A**: 预计增加 3-5 分钟，建议调整至 15 分钟

4. **Q**: 是否需要测试可访问性（Accessibility）？
   - **A**: 使用 `jest-axe` 在组件测试中添加基础可访问性验证

## 测试覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 | 测试文件数 |
|------|-----------|----------------------|-----------|
| Chat Panel 组件 | 0% | 90%+ | 6 |
| Chat Panel Hooks | 0% | 90%+ | 2 |
| Model 管理 | 0% | 90%+ | 4 |
| Chat Sidebar | 29% | 90%+ | 2 |
| **总计** | **0-29%** | **90%+** | **14-16** |
