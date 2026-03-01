# 设计文档：初始化系统单元测试

## Context

### 当前状态

初始化系统（InitializationManager）已经在 `refactor-initialization-system` 变更中实现，包含以下核心模块：

- **InitializationManager**: 初始化管理器，负责步骤执行、依赖解析和错误处理
- **ExecutionContext**: 执行上下文，用于在步骤间传递数据
- **拓扑排序算法**: 根据依赖关系计算执行顺序
- **循环依赖检测**: 验证配置的有效性
- **initSteps 配置**: 定义所有初始化步骤和依赖关系
- **FatalErrorScreen UI 组件**: 致命错误提示界面

当前测试覆盖率为 **0%**，所有逻辑都未经自动化测试验证。

### 技术约束

- **测试框架**: Vitest（项目已配置）
- **组件测试**: React Testing Library（项目已使用）
- **语言**: TypeScript
- **Mock 工具**: Vitest 内置 vi.fn()
- **项目测试风格**: 遵循现有测试模式（如 `Button.test.tsx`）

### 利益相关者

- **开发者**: 需要可靠的测试覆盖，防止回归
- **CI/CD 系统**: 需要自动化测试运行
- **代码审查者**: 需要测试作为功能文档

## Goals / Non-Goals

**Goals:**

1. **全面覆盖核心逻辑**: InitializationManager、ExecutionContext、拓扑排序、循环依赖检测等核心算法达到 80%+ 覆盖率
2. **配置验证**: initSteps 配置的结构和有效性验证
3. **UI 组件测试**: FatalErrorScreen 的交互和渲染测试
4. **快速执行**: 单元测试必须在秒级完成，不影响开发体验
5. **易于维护**: 测试代码清晰，易于理解和修改
6. **测试隔离**: 每个测试独立运行，不依赖执行顺序

**Non-Goals:**

1. **不测试第三方库**: 不测试 i18next、Redux Toolkit、React 等库本身
2. **不测试已删除的模块**: AppRoot、FullscreenLoading 等已删除组件不测试
3. **不做 E2E 测试**: main.tsx 的集成测试留待 Playwright 等 E2E 测试框架
4. **不做性能基准测试**: 不测试初始化速度（可单独进行性能测试）

## Decisions

### 1. 测试文件组织结构

**决策**: 按模块划分测试文件，与源代码结构镜像对应

**理由**:
- 符合项目现有测试组织模式（如 `src/__test__/components/`、`src/__test__/lib/`）
- 便于定位和维护测试代码
- 符合"测试就近原则"（测试与被测试代码靠近）

**结构**:
```
src/__test__/
├── lib/
│   └── initialization/
│       ├── InitializationManager.test.ts    # 核心逻辑测试
│       ├── ExecutionContext.test.ts         # 上下文测试
│       └── fixtures.ts                      # 测试辅助工具（Mock 数据）
├── config/
│   └── initSteps.test.ts                    # 配置验证测试
└── components/
    └── FatalErrorScreen.test.tsx           # UI 组件测试
```

### 2. 测试辅助工具（Fixtures）设计

**决策**: 创建 `fixtures.ts` 统一管理测试数据和 Mock 工厂

**理由**:
- 避免在测试中重复创建 Mock 数据
- 统一测试数据结构，便于维护
- 提供 Mock 工厂函数，简化测试编写

**包含内容**:
```typescript
// Mock InitStep 工厂
createMockInitStep(overrides?: Partial<InitStep>): InitStep

// Mock InitError 工厂
createMockInitError(severity: ErrorSeverity): InitError

// 测试用 InitSteps 配置
createTestInitSteps(): InitStep[]

// Mock ExecutionContext（如果需要）
createMockExecutionContext(): ExecutionContext
```

### 3. InitializationManager 测试策略

**决策**: 使用真实算法 + Mock 步骤执行

**理由**:
- 拓扑排序、循环依赖检测等算法是核心，必须真实测试
- 步骤执行逻辑应该 Mock，避免实际调用 initI18n、initializeMasterKey 等
- 可以控制步骤执行成功/失败，测试各种场景

**测试分层**:
1. **单元测试**: 测试单个方法（validateDependencies、detectCircularDependencies、topologicalSort）
2. **集成测试**: 测试完整流程（runInitialization），使用 Mock 步骤

### 4. UI 组件测试策略

**决策**: 使用 React Testing Library，专注用户交互

**理由**:
- 符合项目现有测试风格（如 `Button.test.tsx`）
- 测试用户行为而非实现细节
- React Testing Library 是项目标准

**Mock 策略**:
- `window.location.reload`: 使用 `vi.fn()` mock
- `import.meta.env.DEV`: 使用 `vi.stubEnv('DEV', true)` 模拟
- i18n: 使用现有的 i18n 测试配置

### 5. 测试隔离和清理

**决策**: 每个测试独立，使用 `beforeEach` 清理

**理由**:
- 避免测试间状态污染
- 确保测试可以单独运行
- 符合 Vitest 最佳实践

**实现**:
```typescript
describe('InitializationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute steps', () => {
    // 测试代码
  });
});
```

### 6. 覆盖率目标设定

**决策**: 分层设定覆盖率目标

**理由**:
- 核心逻辑（80%+）: 算法复杂，需要高覆盖
- 配置文件（70%+）: 主要是结构验证，部分逻辑
- UI 组件（75%+）: 包含交互逻辑，需要中等覆盖

**目标**:
- `InitializationManager.ts`: 80%+
- `types.ts`: 90%+（类型定义容易覆盖）
- `initSteps.ts`: 70%+
- `FatalErrorScreen/index.tsx`: 75%+

## Risks / Trade-offs

### Risk 1: Mock 步骤执行可能隐藏真实集成问题

**风险**: Mock 的 initSteps 可能无法发现实际步骤配置的错误

**缓解措施**:
- 集成测试中使用真实的 `initSteps` 配置
- 但 Mock 每个步骤的 `execute` 函数，避免实际调用
- 验证依赖关系解析和执行顺序的正确性

### Risk 2: 异步测试可能不稳定

**风险**: 拓扑排序和步骤执行涉及异步操作，测试可能不稳定

**缓解措施**:
- 使用 `async/await` 确保异步操作完成
- 设置合理的测试超时时间
- 避免依赖真实时间的测试（使用 vi.useFakeTimers）

### Risk 3: UI 组件测试可能因 i18n 配置失败

**风险**: FatalErrorScreen 测试依赖 i18n 配置，可能因配置问题失败

**缓解措施**:
- 使用项目现有的 i18n 测试配置
- 在测试文件中显式初始化 i18n（如果需要）
- Mock i18n 的 `t` 函数（简化方案）

### Trade-off 1: 测试全面性 vs 测试执行时间

**权衡**:
- **收益**: 更多测试覆盖 = 更高的代码质量
- **代价**: 测试时间增加 = 开发体验下降

**决策**: 平衡策略
- 核心算法全面测试（可以花更多时间）
- 配置验证轻量测试（快速验证）
- UI 组件关键路径测试（不追求 100% 覆盖）

**结论**: 单元测试总时间目标 < 5 秒

### Trade-off 2: Mock 复杂度 vs 测试真实性

**权衡**:
- **收益**: 真实依赖 = 更接近实际运行
- **代价**: 测试不稳定 = 维护成本高

**决策**: 适度使用 Mock
- Mock 外部依赖（i18n、Redux、初始化函数）
- 不 Mock 核心算法（拓扑排序、循环依赖检测）
- 使用工厂函数创建 Mock，保持一致性

## Migration Plan

### 阶段 1: 准备工作

1. **创建测试目录结构**
   ```bash
   mkdir -p src/__test__/lib/initialization
   mkdir -p src/__test__/config
   mkdir -p src/__test__/components
   ```

2. **创建测试辅助工具**（fixtures.ts）
   - 实现 Mock 工厂函数
   - 创建测试数据集

### 阶段 2: 核心逻辑测试

1. **InitializationManager 测试**
   - 验证依赖关系测试
   - 循环依赖检测测试
   - 拓扑排序测试
   - 完整流程测试

2. **ExecutionContext 测试**
   - 数据存储和检索测试
   - 状态跟踪测试

### 阶段 3: 配置和 UI 测试

1. **initSteps 配置验证测试**
   - 结构完整性测试
   - 依赖关系测试

2. **FatalErrorScreen UI 测试**
   - 渲染测试
   - 交互测试
   - DEV 模式测试

### 阶段 4: 集成和验证

1. **运行测试套件**
   ```bash
   pnpm test:run
   ```

2. **生成覆盖率报告**
   ```bash
   pnpm test:coverage
   ```

3. **验证覆盖率目标**
   - 检查各模块覆盖率是否达标
   - 补充遗漏的测试用例

### 回滚策略

如果测试导致 CI/CD 失败或阻塞开发：
- 临时跳过失败的测试（使用 `test.skip`）
- 修复问题后重新启用
- 删除测试（如果发现设计有根本性错误）

## Open Questions

### Q1: 是否需要测试初始化步骤的实际执行（如 initI18n、initializeMasterKey）？

**背景**: 测试是否应该调用实际的初始化函数，还是全部 Mock？

**建议**:
- **单元测试**: 全部 Mock，只测试 InitializationManager 的逻辑
- **集成测试**: 可以使用真实配置，但 Mock 每个步骤的 `execute` 函数
- **理由**: 实际初始化函数可能在测试环境中失败（如 IndexedDB 不可用），增加测试不稳定性

### Q2: 如何测试 Redux Thunk 的 `.unwrap()` 调用？

**背景**: initSteps 中使用 `await store.dispatch(initializeModels()).unwrap()`

**建议**:
- Mock `store.dispatch` 返回 resolved Promise
- Mock `.unwrap()` 方法返回测试数据
- 不实际测试 Redux Thunk 的行为（那属于 Redux 的测试范围）

### Q3: FatalErrorScreen 测试是否需要完整的 i18n 配置？

**背景**: 组件依赖 i18n 的 `t` 函数

**建议**:
- **方案 A**: 使用项目现有的 i18n 测试配置（推荐）
- **方案 B**: Mock `useTranslation` hook，返回固定的翻译文本
- **选择**: 方案 A 更真实，方案 B 更简单。先用方案 A，如果遇到问题再切换到方案 B
