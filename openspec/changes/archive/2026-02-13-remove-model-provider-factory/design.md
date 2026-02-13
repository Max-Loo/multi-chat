## Context

**当前状态**

应用目前使用三层架构管理模型供应商数据：

1. **数据获取层**（`modelRemoteService.ts`）：从 `models.dev` API 获取远程数据，转换为 `RemoteProviderData[]` 格式
2. **工厂注册层**（`modelProviderFactory/index.ts`）：将 `RemoteProviderData` 转换为 `ModelProvider` 实例并注册到 `Map` 中
3. **状态管理层**（`modelProviderSlice.ts`）：管理工厂实例，并通过 `getProviderFactory(key)` 获取供应商

**问题识别**

- **不必要的抽象**：`RemoteProviderData` 和 `ModelProvider` 接口高度重复，字段几乎一致（`providerKey`、`name`、`modelList`、`api`）
- **复杂的数据流**：数据需要经过 `fetchRemoteData()` → `registerDynamicProviders()` → `getModelProvider()` 才能到达消费者
- **维护成本**：维护两套类型定义和转换逻辑（`DynamicModelProvider` 构造函数中的字段映射）
- **Redux state 混乱**：当前 store 存储的是工厂实例，而非纯数据，违反了 Redux 最佳实践

**约束条件**

- 必须保持向后兼容，不能影响现有功能的正常运行
- 不能修改 `modelRemoteService.ts` 的 API（已稳定且经过测试）
- Redux store 结构变更需要考虑迁移策略

**利益相关者**

- 开发团队：需要维护和迭代模型供应商集成逻辑
- 用户：需要快速、可靠地访问模型供应商数据

## Goals / Non-Goals

**Goals:**

- **简化架构**：移除工厂注册层，数据从远程服务直接到 Redux store
- **统一数据模型**：使用 `RemoteProviderData` 作为唯一的供应商数据类型
- **提升可维护性**：减少代码量和类型定义，降低维护成本
- **改进 Redux 实践**：store 存储纯数据对象，而非类实例

**Non-Goals:**

- **不修改** `modelRemoteService.ts` 的核心逻辑（远程获取、缓存、过滤）
- **不改变** `ChatService` 的 API（聊天请求处理逻辑）
- **不重写** Redux slice 的所有逻辑，仅调整数据流

## Decisions

### Decision 1: 移除工厂注册层，直接存储数据到 Redux

**选择**：删除 `modelProviderFactory/index.ts` 和 `registerDynamicProviders.ts`，在 `initializeModelProvider` Thunk 中直接将 `RemoteProviderData[]` 存储到 Redux store。

**理由**：
- **减少间接层**：`RemoteProviderData` 已经包含所有必要的元数据（名称、API 地址、模型列表），无需再包装为 `ModelProvider` 类
- **符合 Redux 最佳实践**：store 应该存储可序列化的纯数据，而非包含方法的类实例
- **简化数据流**：从 `fetchRemoteData()` → Redux store，消费者直接从 store 读取数据

**替代方案**：
- **保留工厂，但简化注册**：无法解决核心问题（重复的类型定义和数据流）
- **使用 `ModelProvider` 但移除工厂**：仍然需要维护两套类型定义

### Decision 2: Redux store 结构调整

**选择**：将 `modelProviderSlice` 的 state 结构从：
```typescript
{
  factories: Map<ModelProviderKeyEnum, ModelProviderFactory>,
  // ... 其他字段
}
```
调整为：
```typescript
{
  providers: RemoteProviderData[],
  loading: boolean,
  error: string | null,
  lastUpdate: string | null
}
```

**理由**：
- **类型安全**：`RemoteProviderData[]` 是明确的、可序列化的类型
- **简化选择器**：消费者可以通过 `useSelector(state => state.modelProvider.providers)` 直接访问数据
- **便于调试**：Redux DevTools 可以正确显示数据

**替代方案**：
- **保留 Map 结构**：无法序列化，违反 Redux 最佳实践

### Decision 3: 消费者重构策略

**选择**：识别所有使用 `getProviderFactory(key)` 的地方，改为从 Redux store 直接查找数据。

**理由**：
- **最小化影响范围**：只重构使用工厂 API 的代码，不触及不相关的逻辑
- **渐进式迁移**：可以逐个模块重构，降低风险

**示例变更**：
```typescript
// 变更前
const factory = getProviderFactory(model.providerKey);
const provider = factory.getModelProvider();
const modelName = provider.modelList.find(m => m.modelKey === model.modelKey)?.modelName;

// 变更后
const providers = useSelector(state => state.modelProvider.providers);
const provider = providers.find(p => p.providerKey === model.providerKey);
const modelName = provider?.models.find(m => m.modelKey === model.modelKey)?.modelName;
```

**替代方案**：
- **创建兼容层**：增加复杂性，且不符合"移除工厂"的目标

### Decision 4: URL 标准化保留

**选择**：保留 `UrlNormalizer` 模块（`src/services/urlNormalizer.ts`），继续用于聊天请求时的 URL 标准化。

**理由**：
- **关注点分离**：URL 标准化是业务逻辑，不应嵌入数据模型中
- **复用现有逻辑**：`ChatService` 已在使用，无需修改

**影响**：
- `RemoteProviderData` 的 `api` 字段存储原始 API 地址（如 `https://api.moonshot.cn`）
- 消费者需要调用 `UrlNormalizer.normalize(provider.api, providerKey)` 来获取标准化的 URL

### Decision 5: 类型导出调整

**选择**：将 `RemoteProviderData` 和相关类型从 `modelRemoteService.ts` 重新导出，作为公共 API。

**理由**：
- **提供稳定的类型定义**：消费者需要导入这些类型来使用 store 中的数据
- **避免内部实现泄漏**：不导出 `ModelsDevApiResponse` 等内部类型

**实施**：
在 `src/services/modelRemoteService.ts` 顶部添加：
```typescript
/**
 * 模型供应商数据（公共类型）
 * @remarks
 * 从 models.dev API 获取并过滤后的供应商数据，存储在 Redux store 中
 */
export type { RemoteProviderData, ModelDetail };
```

## Risks / Trade-offs

### Risk 1: 消费者代码重构遗漏

**风险**：可能存在未识别的使用 `getProviderFactory()` 的代码路径，运行时抛出错误。

**缓解措施**：
- **全局搜索**：使用 `grep` 搜索 `getProviderFactory` 和 `registerProviderFactory` 的所有引用
- **类型检查**：删除工厂模块后运行 `tsc --noEmit`，确保类型系统捕获所有引用
- **回归测试**：在合并前执行完整的端到端测试，覆盖模型选择和聊天发送流程

### Risk 2: URL 标准化逻辑分散

**风险**：URL 标准化逻辑依赖消费者手动调用 `UrlNormalizer`，可能导致不一致。

**缓解措施**：
- **文档化**：在 `RemoteProviderData` 的 JSDoc 中明确说明需要使用 `UrlNormalizer`
- **代码审查**：确保所有新代码正确使用 URL 标准化
- **未来优化**：考虑在 `ChatService` 中自动标准化 URL（作为后续改进）

### Risk 3: Redux 状态迁移

**风险**：如果用户已登录并有旧版本的缓存 store，迁移可能导致数据丢失。

**缓解措施**：
- **版本化 store**：在 Redux store 中添加 `version` 字段，检测旧版本时自动清空 `modelProvider` state
- **降级策略**：如果迁移失败，重新从远程 API 或缓存加载数据

### Trade-off: 内存占用 vs 可维护性

**权衡**：删除工厂类后，每个供应商的 `modelList` 数据在 Redux store 中可能存在多份（如果多个组件使用）。

**分析**：
- **旧架构**：工厂单例共享 `modelList`，内存占用较小
- **新架构**：Redux store 中的数据是不可变的，引用共享自动处理（Redux 使用结构共享）
- **结论**：内存占用增加可忽略不计，而可维护性提升显著

## Migration Plan

### 阶段 1: 准备工作（不破坏现有功能）

1. **创建新的 Redux slice 结构**（不删除旧代码）
   - 添加 `providers: RemoteProviderData[]` 字段到 `modelProviderSlice`
   - 修改 `initializeModelProvider` 和 `refreshModelProvider` Thunk，同时填充新旧字段
   - **验证**：运行应用，确认新旧数据结构一致

2. **识别所有消费者**
   ```bash
   grep -r "getProviderFactory" src/
   grep -r "registerProviderFactory" src/
   ```

### 阶段 2: 重构消费者（渐进式迁移）

3. **重构 `modelSlice.ts`**
   - 修改 `initializeModels` Thunk，从 `state.modelProvider.providers` 加载供应商数据
   - 删除对 `getProviderFactory()` 的调用
   - **验证**：启动应用，确认模型数据正确加载

4. **重构 `Settings` 页面**
   - 修改"刷新模型供应商"按钮逻辑
   - 修改供应商列表显示逻辑
   - **验证**：手动刷新功能正常工作

5. **重构其他消费者**（如果有）
   - 根据阶段 1 的搜索结果逐个重构

### 阶段 3: 清理旧代码

6. **删除工厂模块**
   - 删除 `src/lib/factory/modelProviderFactory/index.ts`
   - 删除 `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`（如果存在）
   - 删除整个 `src/lib/factory/modelProviderFactory/` 目录（如果为空）

7. **清理 Redux slice**
   - 删除旧的 `factories` 字段
   - 删除旧的 `getProviderFactory()` 选择器（如果存在）

8. **更新类型导出**
   - 从 `modelRemoteService.ts` 重新导出 `RemoteProviderData` 和相关类型
   - 更新所有导入路径

### 阶段 4: 验证和测试

9. **类型检查**
   ```bash
   pnpm tsc
   ```

10. **Lint 检查**
    ```bash
    pnpm lint
    ```

11. **端到端测试**
    - 启动应用，确认供应商数据正常加载
    - 选择模型并发送聊天消息，确认功能正常
    - 刷新供应商数据，确认手动刷新功能正常

### 回滚策略

如果生产环境出现严重问题：

1. **立即回滚**：恢复到上一个稳定版本
2. **修复数据迁移**：检查并修复 Redux store 迁移逻辑
3. **重新发布**：经过充分测试后重新部署

## Open Questions

### Q1: 是否需要保留 `ModelProviderKeyEnum`？

**背景**：`RemoteProviderData.providerKey` 是 `string` 类型，而 `ModelProviderKeyEnum` 是枚举类型。

**选项**：
- **保留枚举**：提供类型安全，但需要维护映射关系
- **使用字符串字面量**：简化类型定义，但失去编译时检查

**建议**：保留 `ModelProviderKeyEnum`，在 `RemoteProviderData` 定义中使用：
```typescript
export interface RemoteProviderData {
  providerKey: ModelProviderKeyEnum; // 使用枚举类型
  // ...
}
```

**理由**：与现有代码保持一致，提供更好的类型安全性。

### Q2: 是否需要版本化 Redux store？

**背景**：store 结构变更可能导致已登录用户的本地缓存失效。

**选项**：
- **添加版本字段**：检测旧版本并自动迁移
- **强制清空**：每次应用启动时清空 `modelProvider` state

**建议**：不添加版本字段，依赖 `initializeModelProvider` 的降级策略。

**理由**：
- 供应商数据可以从远程 API 或缓存重新加载，不需要持久化
- 简化实现，减少维护成本

### Q3: URL 标准化是否应该自动处理？

**背景**：当前需要消费者手动调用 `UrlNormalizer.normalize()`。

**选项**：
- **保持现状**：消费者手动调用
- **自动标准化**：在 `RemoteProviderData` 中添加 `getNormalizedApi()` 方法
- **ChatService 处理**：在聊天请求时自动标准化

**建议**：保持现状，作为未来改进考虑。

**理由**：
- 当前变更范围已经足够大，不增加额外风险
- URL 标准化逻辑独立，可以单独优化
