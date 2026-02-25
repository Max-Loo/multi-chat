# 统一 Mock 策略系统设计文档

## Context

### 背景和现状

当前项目测试体系存在以下问题：
1. **Mock 配置分散**：部分 Mock 在 `setup.ts` 中配置（如 `shell`, `os`, `http`, `store`），部分在测试文件中配置（如 `keyring`）
2. **策略不一致**：某些模块被全局 Mock，某些按需 Mock，缺乏清晰的规则
3. **测试隔离不足**：缺少统一的 `beforeEach`/`afterEach` 清理机制，测试间可能相互影响
4. **重复代码**：多个测试文件中存在重复的 Mock 配置代码和测试数据创建逻辑

### 约束条件

- 必须保持向后兼容，现有测试无需立即修改
- 复用现有的 Vitest、happy-dom、fake-indexeddb 依赖
- 遵循项目现有的 `@/` 路径别名规范
- 支持渐进式迁移，新旧 Mock 策略可以共存

### 相关方

- 测试编写者：需要简单易用的 Mock API
- 维护者：需要清晰的 Mock 配置结构和生命周期管理
- CI/CD 系统：需要稳定可靠的测试执行环境

---

## Goals / Non-Goals

**Goals:**

1. 建立统一的 Mock 工厂系统，提供标准化的 Mock 创建 API
2. 创建 Mock 配置中心，集中管理所有 Mock 配置和生命周期
3. 实现测试环境隔离机制，确保测试用例独立运行
4. 提供测试辅助工具库（fixtures、assertions、验证工具）
5. 制定清晰的测试文件组织规范和命名约定
6. 支持渐进式迁移，新旧系统可以共存

**Non-Goals:**

1. 不强制立即迁移所有现有测试
2. 不引入新的测试框架或运行时
3. 不改变现有的测试命令和 CI 配置
4. 不处理 E2E 测试（仅关注单元测试和集成测试）

---

## Decisions

### 决策 1：目录结构设计

**选择**：采用集中式 `test-helpers` 目录结构

```
src/
├── __test__/
│   ├── setup.ts                    # 入口：导入全局配置
│   ├── helpers/                    # 测试辅助工具（新建）
│   │   ├── index.ts               # 统一导出
│   │   ├── mocks/                 # Mock 工厂
│   │   │   ├── index.ts
│   │   │   ├── tauri.ts           # Tauri API Mock
│   │   │   ├── crypto.ts          # 加密相关 Mock
│   │   │   ├── storage.ts         # 存储相关 Mock
│   │   │   └── router.ts          # 路由 Mock
│   │   ├── fixtures/              # 测试数据工厂
│   │   │   ├── index.ts
│   │   │   ├── model.ts           # Model 数据工厂
│   │   │   └── crypto.ts          # 加密测试数据
│   │   ├── assertions/            # 自定义断言
│   │   │   ├── index.ts
│   │   │   └── crypto.ts          # 加密相关断言
│   │   └── isolation/             # 环境隔离工具
│   │       ├── index.ts
│   │       └── reset.ts           # 重置工具
│   └── fixtures/                  # 静态测试数据（新建）
│       └── test-data.json
```

**备选方案**：
1. ❌ 分散在各个模块内部：难以统一管理，增加查找成本
2. ❌ 使用 `__mocks__` 目录：与 Vitest 的自动 Mock 机制混淆

**理由**：集中式结构便于管理、查找和维护，同时避免与 Vitest 内置机制冲突。

---

### 决策 2：Mock 工厂模式设计

**选择**：采用工厂函数 + 预设配置模式

```typescript
// helpers/mocks/tauri.ts
export const createTauriMocks = (options?: TauriMockOptions) => {
  const defaultOptions = { isTauri: true, ... };
  const config = { ...defaultOptions, ...options };
  
  return {
    shell: createShellMock(config),
    os: createOsMock(config),
    http: createHttpMock(config),
    store: createStoreMock(config),
    keyring: createKeyringMock(config),
    // 工具方法
    resetAll: () => { ... },
    configure: (newOptions) => { ... },
  };
};

// 使用示例
const mocks = createTauriMocks({ isTauri: false });
mocks.keyring.getPassword.mockResolvedValue('test-key');
```

**备选方案**：
1. ❌ 类实例模式：需要手动管理实例，使用不够简洁
2. ❌ 全局单例模式：测试间隔离困难，容易产生状态污染

**理由**：工厂函数模式灵活、易用，支持按需配置，便于测试隔离。

---

### 决策 3：Mock 生命周期管理

**选择**：三层配置体系（全局默认 → 测试套件覆盖 → 单个测试覆盖）

```typescript
// 1. 全局默认配置（setup.ts）
import { setupGlobalMocks } from '@/__test__/helpers';
setupGlobalMocks();

// 2. 测试套件覆盖
describe('MyComponent', () => {
  beforeEach(() => {
    const mocks = createTauriMocks({ isTauri: false });
    mocks.keyring.getPassword.mockResolvedValue('test-key');
  });
  
  afterEach(() => {
    resetAllMocks(); // 统一清理
  });
});

// 3. 单个测试覆盖
it('should handle error', () => {
  mockKeyringGetPassword.mockRejectedValue(new Error('failed'));
  // ...
});
```

**理由**：三层体系提供足够的灵活性，同时保持配置的可预测性。

---

### 决策 4：测试隔离策略

**选择**：显式隔离 + 自动清理

```typescript
// helpers/isolation/reset.ts
export const resetTestState = () => {
  // 重置 localStorage
  localStorage.clear();
  
  // 重置所有 Mock 调用
  vi.clearAllMocks();
  
  // 重置模块缓存（可选）
  // vi.resetModules();
};

// 使用方式
afterEach(() => {
  resetTestState();
});
```

**理由**：
- 显式调用让开发者清楚知道何时重置
- 避免隐式行为导致的调试困难
- 支持选择性重置

---

### 决策 5：测试数据工厂设计

**选择**：Builder 模式 + 预设模板

```typescript
// helpers/fixtures/model.ts
export const createMockModel = (overrides?: Partial<Model>): Model => ({
  id: 'test-model-1',
  createdAt: '2024-01-01 00:00:00',
  updateAt: '2024-01-01 00:00:00',
  providerName: 'OpenAI',
  providerKey: ModelProviderKeyEnum.OPEN_AI,
  nickname: 'Test Model',
  modelName: 'gpt-4',
  modelKey: 'gpt-4',
  apiKey: 'sk-test-123',
  apiAddress: 'https://api.openai.com/v1',
  isEnable: true,
  ...overrides,
});

// 使用示例
const model = createMockModel({ apiKey: 'custom-key' });
```

**理由**：简单直观，支持部分覆盖，符合项目现有代码风格。

---

### 决策 6：迁移策略

**选择**：渐进式迁移，新旧共存

**迁移顺序**：
1. 创建新的 helper 系统（不修改现有代码）
2. 在新测试中使用新系统
3. 逐步迁移现有测试（可选，按模块进行）
4. 最终移除旧的 Mock 配置（可选）

**理由**：
- 降低风险，避免大规模重构
- 团队可以按需学习新系统
- 保持开发节奏

---

## Risks / Trade-offs

### 风险 1：学习成本

**风险**：团队需要学习新的 Mock API

**缓解**：
- 提供详细的文档和使用示例
- 保持 API 简单直观
- 在代码审查中提供指导

### 风险 2：新旧系统混淆

**风险**：新旧 Mock 系统同时存在可能导致混淆

**缓解**：
- 在文档中明确推荐使用新系统
- 为旧系统添加 `@deprecated` 标记（可选）
- 定期审查并迁移旧测试

### 风险 3：过度抽象

**风险**：过度抽象的 Mock 工厂可能增加复杂度

**缓解**：
- 保持 Mock 工厂的职责单一
- 仅对高频使用的模块创建 Mock 工厂
- 允许直接使用 `vi.fn()` 进行简单 Mock

### Trade-off 1：灵活性 vs 一致性

**选择**：优先一致性，在关键点保留灵活性

**说明**：统一 API 提高可维护性，但允许在特殊场景下直接使用底层 Mock API。

### Trade-off 2：自动化 vs 显式控制

**选择**：偏向显式控制

**说明**：虽然自动清理更方便，但显式调用让开发者更清楚测试行为，便于调试。

---

## Open Questions

1. ~~是否需要为 React 组件创建专门的 Mock 工具？~~ → 暂不需要，`@testing-library/react` 已提供足够的工具
2. 是否需要创建 Mock 状态调试工具？
3. 是否需要支持 Mock 快照功能？

---

## Appendix：文件路径别名配置

需要在 `tsconfig.json` 中添加路径别名：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/test-helpers/*": ["./src/__test__/helpers/*"]
    }
  }
}
```

同时更新 `vite.config.ts`：

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    "@/test-helpers": path.resolve(__dirname, "./src/__test__/helpers"),
  },
}
```
