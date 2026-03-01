# 设计文档：初始化系统重构

## Context

### 当前架构状态

应用当前的初始化逻辑存在以下问题：

1. **分散的初始化逻辑**：初始化代码分散在 `main.tsx` 和 `AppRoot.tsx` 中，缺乏统一管理
2. **不一致的错误处理**：
   - `initI18n()` 静默失败（返回 `undefined`）
   - `initializeMasterKey()` 抛出异常但未被捕获
   - Redux Thunk 的错误通过 state 管理，但只有 `modelProvider` 有 UI 展示
3. **缺乏依赖管理**：步骤之间无法声明依赖关系，未来扩展困难
4. **多层渲染**：`main.tsx` → `AppRoot.tsx` → `RouterProvider`，增加了不必要的组件层级

### 技术约束

- **框架**：React 19 + TypeScript
- **状态管理**：Redux Toolkit (异步操作使用 createAsyncThunk)
- **国际化**：i18next
- **UI 组件库**：shadcn/ui (基于 Radix UI)
- **构建工具**：Vite
- **运行环境**：Tauri 桌面应用 + Web 浏览器

### 利益相关者

- **开发者**：需要清晰的架构和易于扩展的初始化系统
- **用户**：需要清晰的错误提示和良好的初始化体验

## Goals / Non-Goals

**Goals:**

1. **统一错误处理**：所有初始化步骤的错误都通过统一的机制捕获和处理
2. **支持依赖关系**：允许步骤声明依赖，自动优化执行顺序
3. **提升用户体验**：
   - 致命错误：全屏提示 + 刷新按钮
   - 警告错误：Toast 通知
   - 可忽略错误：控制台输出
4. **简化架构**：移除 `AppRoot.tsx`，统一入口到 `main.tsx`
5. **易于扩展**：添加新初始化步骤只需修改配置文件

**Non-Goals:**

1. **不改变现有功能**：仅重构实现方式，不改变功能需求
2. **不增加外部依赖**：使用现有的技术栈
3. **不实现复杂的依赖注入**：使用简单的 context 传递机制即可
4. **不实现分布式追踪**：错误日志只记录在控制台，不发送到远程服务

## Decisions

### 1. 采用轻量级包装器方案（方案 C）

**决策**：使用 `InitializationManager` + `ExecutionContext` 的轻量级包装器方案，而不是完整的状态机或事件流方案。

**理由**：
- **简洁性**：符合 KISS 原则，易于理解和维护
- **渐进式迁移**：可以逐步迁移现有初始化步骤
- **最小改动**：不需要大规模重构现有代码
- **足够灵活**：支持依赖关系、并行执行和错误处理

**替代方案**：
- **方案 A（状态机）**：过于复杂，对于简单的初始化流程是过度设计
- **方案 B（事件流）**：学习曲线陡峭，引入了不必要的响应式编程范式

### 2. 使用依赖声明 + 拓扑排序

**决策**：通过 `dependencies` 字段显式声明依赖，自动进行拓扑排序优化执行顺序。

**理由**：
- **清晰的依赖关系**：代码即文档，一眼就能看出依赖关系
- **自动优化**：可以并行执行无依赖的步骤，提升启动速度
- **易于验证**：可以在构建时检查循环依赖

**实现**：
```typescript
interface InitStep {
  name: string;
  dependencies?: string[]; // 依赖的步骤名称列表
  execute: (context: ExecutionContext) => Promise<void>;
}
```

**示例**：
```
步骤依赖图：
  i18n (无依赖)
  masterKey (无依赖)
    ↓     ↓
  models (依赖: masterKey)
  appLanguage (依赖: i18n)
```

**执行顺序**：
- 第 1 组（并行）：`i18n`、`masterKey`
- 第 2 组（并行）：`models`、`appLanguage`

### 3. 三级错误处理机制

**决策**：根据错误的严重程度分为三个级别，每个级别有不同的展示和恢复策略。

**错误级别定义**：

| 级别 | 定义 | 展示方式 | 恢复选项 | 示例 |
|------|------|---------|---------|------|
| **fatal** | 应用完全无法使用 | 全屏错误提示 | 刷新页面 | 主密钥初始化失败 |
| **warning** | 功能降级但仍可用 | Toast 通知 | 无需操作 | 模型供应商获取失败（有缓存） |
| **ignorable** | 不影响核心功能 | 控制台输出 | 无需操作 | 统计初始化失败 |

**理由**：
- **用户友好**：致命错误和警告错误有不同的处理方式，避免打断用户
- **开发友好**：可忽略的错误不会在 UI 中显示，减少噪音
- **灵活的恢复策略**：可以根据错误严重程度提供不同的恢复选项

### 4. 移除 AppRoot 组件

**决策**：将 `AppRoot.tsx` 的逻辑融入 `main.tsx`，移除该组件。

**理由**：
- **简化架构**：减少一层不必要的组件包装
- **统一入口**：所有初始化和错误处理逻辑都在 `main.tsx` 中
- **避免复杂性**：不需要在组件中监听 Redux state 进行错误处理

**实现**：
```typescript
// main.tsx
const result = await manager.runInitialization({ steps });

if (!result.success) {
  rootDom.render(<FatalErrorScreen errors={result.fatalErrors} />);
} else {
  // 检查 modelProvider 的致命错误
  const modelProviderError = store.getState().modelProvider.error;
  if (modelProviderError === '无法获取模型供应商数据，请检查网络连接') {
    rootDom.render(<NoProvidersAvailable />);
  } else {
    rootDom.render(<RouterProvider router={router} />);
  }
}
```

### 5. 使用 Redux Thunk 的 `.unwrap()` 方法

**决策**：在 InitStep 中使用 `await store.dispatch(thunk()).unwrap()` 来等待 Thunk 完成。

**理由**：
- **统一错误处理**：`.unwrap()` 会在 Thunk 失败时抛出错误，可以被 `InitializationManager` 捕获
- **等待完成**：确保 Thunk 执行完成后再继续后续步骤
- **保持兼容**：不影响其他代码中对 Thunk 的调用

**示例**：
```typescript
{
  name: 'models',
  execute: async (context) => {
    const models = await store.dispatch(initializeModels()).unwrap();
    context.setResult('models', models);
  },
}
```

### 6. ExecutionContext 的内存存储

**决策**：使用 `Map` 数据结构在内存中存储步骤执行结果。

**理由**：
- **简单高效**：不需要持久化，初始化完成后即可丢弃
- **类型安全**：通过泛型 `getResult<T>()` 提供类型安全
- **易于实现**：几行代码即可实现

**实现**：
```typescript
interface ExecutionContext {
  results: Map<string, unknown>;

  setResult(name: string, value: unknown): void;
  getResult<T>(name: string): T | undefined;
  isSuccess(name: string): boolean;
}
```

## Risks / Trade-offs

### Risk 1: 循环依赖导致初始化卡死

**风险**：如果步骤之间存在循环依赖，拓扑排序会检测到并抛出错误，导致应用无法启动。

**缓解措施**：
- **依赖检查**：在构建时验证依赖图的有效性
- **清晰的错误提示**：循环依赖时，明确指出哪些步骤形成了循环
- **文档说明**：在 `config/initSteps.ts` 中添加注释，说明依赖关系

### Risk 2: 错误严重程度分类不当

**风险**：如果某个错误的严重程度分类不当（例如将致命错误误分类为警告），可能导致应用在不完整的状态下运行。

**缓解措施**：
- **默认策略**：关键步骤（`critical: true`）的错误默认为 `fatal`
- **Code Review**：所有的错误分类都需要经过审查
- **测试覆盖**：为每个初始化步骤编写测试用例，验证错误处理

### Risk 3: 上下文传递的类型安全问题

**风险**：`getResult<T>()` 依赖调用者正确指定类型，可能导致类型错误。

**缓解措施**：
- **TypeScript 严格模式**：启用严格的类型检查
- **单元测试**：测试依赖关系中的数据传递
- **文档说明**：在 InitStep 定义中注释每个步骤返回的数据类型

### Trade-off 1: 简洁性 vs 灵活性

**权衡**：选择了轻量级方案而非完整的状态机或事件流方案。

**收益**：
- ✅ 代码更简洁，易于理解
- ✅ 不需要引入新的概念和依赖
- ✅ 符合项目的现有架构风格

**代价**：
- ⚠️ 缺乏复杂的状态管理能力（但对于初始化流程来说不是问题）
- ⚠️ 无法支持非常复杂的依赖关系（但当前项目不需要）

**结论**：简洁性的收益远大于灵活性的损失。

### Trade-off 2: 向后兼容性 vs 改造彻底性

**权衡**：选择保留现有函数的导出，仅修改使用方式。

**收益**：
- ✅ 不破坏现有代码
- ✅ 可以逐步迁移
- ✅ 降低重构风险

**代价**：
- ⚠️ 需要维护两套调用方式（旧的和新的）

**结论**：向后兼容性更重要，可以降低重构风险。

## Migration Plan

### 阶段 1：准备工作

1. **创建初始化管理器**：
   - 实现 `InitializationManager` 类
   - 实现 `ExecutionContext` 接口
   - 编写单元测试

2. **创建 UI 组件**：
   - 实现 `<FatalErrorScreen />`
   - 实现 `<InitializationScreen />`

3. **更新国际化文件**：
   - 添加错误提示文本

### 阶段 2：适配现有模块

1. **修改独立函数**：
   - 移除 `initI18n()` 的 try-catch

2. **创建适配层**：
   - 创建 `config/initSteps.ts`
   - 定义所有 InitStep 配置

### 阶段 3：重构 main.tsx

1. **使用新的初始化系统**：
   - 替换现有的初始化逻辑
   - 融入 `AppRoot` 的错误处理逻辑

2. **移除旧组件**：
   - 删除 `AppRoot.tsx`
   - 删除 `FullscreenLoading/index.tsx`

### 阶段 4：测试和验证

1. **功能测试**：
   - 测试正常初始化流程
   - 测试错误场景（致命错误、警告错误、可忽略错误）

2. **依赖关系测试**：
   - 测试步骤间的依赖关系
   - 测试并行执行

3. **回滚策略**：
   - 保留旧代码的备份（通过 Git）
   - 如果发现严重问题，可以快速回滚

## Open Questions

### Q1: 是否需要支持步骤的重试机制？

**背景**：某些初始化步骤可能因为网络问题暂时失败，是否支持自动重试？

**建议**：
- **初期不支持**：简化实现，让用户手动刷新页面
- **未来扩展**：如果确实需要，可以在 `InitStep` 中添加 `retry` 配置项

### Q2: 是否需要支持超时控制？

**背景**：某些步骤可能长时间卡住（如网络请求），是否需要超时机制？

**建议**：
- **初期不支持**：依赖浏览器和 Tauri 的默认超时
- **未来扩展**：可以在 `InitStep` 中添加 `timeout` 配置项

### Q3: 是否需要支持跳过非关键步骤？

**背景**：某个非关键步骤失败时，是否允许用户选择跳过并继续？

**建议**：
- **初期不支持**：简化实现，非关键步骤失败只显示警告
- **未来扩展**：如果用户需要，可以在 `FatalErrorScreen` 中添加"跳过"按钮
