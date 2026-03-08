## Context

### 当前状态

应用启动时，`modelProvider` 初始化步骤总是先尝试从远程 API 获取数据（`https://models.dev/api.json`），即使本地已有缓存也会等待网络请求完成。这导致：

- **启动时间过长**：远程请求耗时 5 秒（超时）+ 最多 2 次重试（指数退避），最长可达 12 秒
- **用户体验差**：即使有缓存数据，应用也慢速启动
- **资源浪费**：重复的网络请求增加服务器负载

### 现有架构

当前实现位于 `src/store/slices/modelProviderSlice.ts`：

```typescript
// 当前实现：总是先尝试远程请求
export const initializeModelProvider = createAsyncThunk(
  'modelProvider/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // 1. 总是先请求远程
      const { fullApiResponse, filteredData } = await fetchRemoteData();
      await saveCachedProviderData(fullApiResponse);
      return { providers: filteredData, lastUpdate: new Date().toISOString() };
    } catch (error) {
      // 2. 远程失败才降级到缓存
      const cachedData = await loadCachedProviderData(ALLOWED_MODEL_PROVIDERS);
      return rejectWithValue({
        providers: cachedData,
        error: '远程数据获取失败，已使用缓存',
      });
    }
  }
);
```

### 约束条件

- **不改变现有 API**：`initializeModelProvider` 的调用方式不变
- **保持错误处理**：无缓存且远程失败时的错误提示流程不变
- **向后兼容**：已有的 `refreshModelProvider` 手动刷新功能不受影响
- **测试覆盖**：必须为新逻辑添加充分的单元测试和集成测试

## Goals / Non-Goals

**Goals:**

1. **快速启动**：有缓存时，modelProvider 初始化在 100ms 内完成
2. **数据新鲜度**：通过后台刷新保持数据及时性
3. **用户无感知**：后台刷新失败时静默处理，不打扰用户
4. **容错性**：无缓存场景保持现有错误处理流程
5. **可测试性**：新逻辑必须有完整的测试覆盖

**Non-Goals:**

1. **不改变缓存策略**：缓存过期时间、格式保持不变（24 小时）
2. **不改变白名单过滤**：ALLOWED_MODEL_PROVIDERS 逻辑不变
3. **不修改 UI 组件**：ModelSidebar、ModelProviderSetting 等组件无需变更
4. **不添加配置选项**：不引入用户可配置的"快速模式"开关
5. **不改变其他初始化步骤**：只优化 modelProvider，不影响其他初始化逻辑

## Decisions

### 决策 1：快速路径 - 优先检查缓存

**选择**：在 `initializeModelProvider` 中先尝试加载缓存，有缓存则立即返回。

**理由**：
- **性能最优**：有缓存场景启动时间从 5-12 秒降低到 < 100ms
- **实现简单**：只需调整现有代码的执行顺序
- **风险可控**：无缓存时仍会请求远程，保持容错性

**替代方案**：
- *方案 A*：保持当前实现，仅在远程请求超时更快时才降级 → 仍会等待网络，收益有限
- *方案 B*：添加配置选项让用户选择"快速模式" → 增加复杂度，不符合 KISS 原则
- *方案 C*：在 UI 层实现快速显示，后台请求 → 违反单一数据源原则，增加状态管理复杂度

**实现细节**：

```typescript
export const initializeModelProvider = createAsyncThunk(
  'modelProvider/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // 1️⃣ 快速路径：先尝试加载缓存
      const cachedData = await loadCachedProviderData(ALLOWED_MODEL_PROVIDERS);

      // 验证缓存数据完整性
      if (!Array.isArray(cachedData) || cachedData.length === 0) {
        throw new Error('Invalid cache data format');
      }

      return {
        providers: cachedData,
        lastUpdate: null,
      };
    } catch (cacheError) {
      // 缓存不存在或无效，继续尝试远程请求
      void cacheError;
    }

    try {
      // 2️⃣ 无缓存，尝试远程请求
      const { fullApiResponse, filteredData } = await fetchRemoteData();
      await saveCachedProviderData(fullApiResponse);
      return {
        providers: filteredData,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      // 3️⃣ 远程请求失败，无缓存可用
      return rejectWithValue({
        providers: [],
        error: '无法获取模型供应商数据，请检查网络连接',
      });
    }
  }
);
```

### 决策 2：后台静默刷新 - 新增独立 Thunk

**选择**：新增 `silentRefreshModelProvider` Thunk，在初始化完成后异步触发。

**理由**：
- **职责分离**：快速初始化和后台刷新是两个独立的关注点
- **失败静默**：不影响用户体验，后台失败时不显示错误
- **易于测试**：独立的 Thunk 便于单元测试

**替代方案**：
- *方案 A*：在 `initializeModelProvider` 中异步刷新 → 违反 Thunk 语义，难以测试
- *方案 B*：使用 `refreshModelProvider` 但修改错误处理 → 破坏现有手动刷新功能
- *方案 C*：不刷新，只在用户手动操作时更新 → 数据可能长期过时

**实现细节**：

**并发控制策略**：

为了避免并发刷新导致的竞态条件，采用 **dispatch 前检查** 的并发控制策略（而非在 Thunk 内部检查）：

```typescript
// 在调用方（main.tsx）封装函数中检查并发
export function triggerSilentRefreshIfNeeded(store: StoreInterface): void {
  const state = store.getState();
  const modelProviderState = state.modelProvider;

  // 在 dispatch 之前检查是否已有后台刷新在进行
  if (!modelProviderState.backgroundRefreshing) {
    console.log('[triggerSilentRefreshIfNeeded] 触发后台静默刷新');
    store.dispatch(silentRefreshModelProvider());
  } else {
    console.log('[triggerSilentRefreshIfNeeded] 已有后台刷新在进行，跳过');
  }
}
```

**为什么采用 dispatch 前检查**：

- **避免 Redux Toolkit 执行顺序问题**：`createAsyncThunk` 在执行 Thunk 函数体之前会先 dispatch `pending` action，导致 `backgroundRefreshing` 已被设置为 `true`
- **职责分离**：并发控制逻辑由调用方负责，Thunk 本身专注于数据刷新
- **更清晰的控制流**：在 `main.tsx` 中明确表达"如果需要则触发"的意图

**Thunk 实现**：

```typescript
export const silentRefreshModelProvider = createAsyncThunk(
  'modelProvider/silentRefresh',
  async (_, { rejectWithValue }) => {
    try {
      const { fullApiResponse, filteredData } = await fetchRemoteData();
      await saveCachedProviderData(fullApiResponse);
      return {
        providers: filteredData,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      // 静默失败，返回空对象，extraReducers 不处理
      return rejectWithValue({});
    }
  }
);
```

**状态转换**：

```typescript
// extraReducers
builder
  .addCase(silentRefreshModelProvider.pending, (state) => {
    // 设置后台刷新锁，防止并发
    state.backgroundRefreshing = true;
  })
  .addCase(silentRefreshModelProvider.fulfilled, (state, action) => {
    state.backgroundRefreshing = false;
    state.providers = action.payload.providers;
    state.lastUpdate = action.payload.lastUpdate;
    // 只有当前有错误时才清除（表示成功恢复了）
    if (state.error !== null) {
      state.error = null;
    }
  })
  .addCase(silentRefreshModelProvider.rejected, (state, action) => {
    // 释放后台刷新锁
    state.backgroundRefreshing = false;
    // 静默失败，保持所有现有状态（包括 error、providers、lastUpdate）
    // 不做任何修改，让用户继续使用当前数据
  })
```

### 决策 3：后台刷新触发时机 - 初始化完成后立即触发

**选择**：在 `main.tsx` 的初始化流程完成后立即触发后台刷新。

**理由**：
- **及时更新**：确保数据尽快更新到最新状态
- **避免竞争**：在所有初始化步骤完成后触发，避免与其他资源加载冲突
- **简单可靠**：不需要额外的调度逻辑或定时器

**替代方案**：
- *方案 A*：延迟 5-10 秒触发 → 推迟数据更新，用户体验差
- *方案 B*：用户进入设置页面时触发 → 数据更新不及时
- *方案 C*：使用 setInterval 定期刷新 → 增加复杂度和服务器负载

**实现细节**：

```typescript
// main.tsx
const result = await manager.runInitialization({
  steps: initSteps,
  onProgress: (current, total, currentStep) => {
    console.log(`初始化进度: ${current}/${total} - ${currentStep}`);
  },
});

// 应用渲染后，处理安全性警告
await handleSecurityWarning();

// 🆕 后台静默刷新 modelProvider 数据
store.dispatch(silentRefreshModelProvider());
```

### 决策 4：Redux 状态管理 - 添加后台刷新锁

**选择**：添加 `backgroundRefreshing` 字段，用于防止后台刷新并发执行。

**理由**：
- **并发控制**：通过锁机制确保后台刷新的原子性，避免竞态条件
- **最小变更**：仅新增一个布尔字段，不改变现有字段，降低复杂度
- **向后兼容**：UI 组件无需修改（新字段仅用于内部状态管理）
- **简化测试**：现有测试框架可直接使用

**状态变化**：

```typescript
// 状态新增字段：backgroundRefreshing
export interface ModelProviderSliceState {
  providers: RemoteProviderData[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  backgroundRefreshing: boolean; // 🆕 后台刷新进行中标志
}

// initializeModelProvider.fulfilled：
// - providers: 缓存数据或远程数据
// - lastUpdate: 缓存为 null，远程为 ISO 时间
// - error: null
// - loading: false
// - backgroundRefreshing: 不改变

// silentRefreshModelProvider.pending：
// - backgroundRefreshing: true（设置锁）
// - 其他字段: 不改变

// silentRefreshModelProvider.fulfilled：
// - providers: 更新为远程数据
// - lastUpdate: 更新为 ISO 时间
// - error: 仅在当前有错误时清除（成功恢复的情况）
// - backgroundRefreshing: false（释放锁）
// - loading: 不改变（保持原状态，后台刷新不影响 UI loading）

// silentRefreshModelProvider.rejected：
// - backgroundRefreshing: false（释放锁）
// - providers: 不改变（保持当前数据）
// - lastUpdate: 不改变（保持当前时间）
// - error: 不改变（保持当前错误状态或 null）
// - loading: 不改变（保持原状态）
```

## Risks / Trade-offs

### 风险 1：缓存数据过期

**描述**：用户可能看到过期的供应商数据（缓存时间 > 24 小时）。

**缓解措施**：
- 后台刷新在启动后立即执行，通常在几秒内完成
- 用户可以手动刷新（设置页面的刷新按钮）
- 添加数据时间戳显示（lastUpdate 字段已在 UI 中显示）

**权衡**：接受短暂的数据过期，换取显著的启动性能提升（90%+ 场景）。

### 风险 2：并发刷新冲突

**描述**：后台刷新和用户手动刷新可能同时触发。

**缓解措施**：
- **dispatch 前并发控制**：在调用方（`triggerSilentRefreshIfNeeded`）中，在 dispatch 之前检查 `backgroundRefreshing` 状态，避免并发
- **手动刷新优先级**：用户手动刷新会设置 `loading = true`，阻止后台刷新（因为后台刷新也检查 `backgroundRefreshing`）
- Redux 单线程更新机制确保状态更新的原子性
- 两次刷新都成功时，最后一次更新生效（幂等操作）

**权衡**：通过 dispatch 前检查 + `backgroundRefreshing` 锁避免并发刷新，确保后台刷新的原子性。

### 风险 3：无缓存 + 网络错误场景

**描述**：首次安装或缓存被清除时，网络错误导致应用无法使用。

**缓解措施**：
- 现有的 `NoProvidersAvailable` 组件已提供友好的错误提示
- 用户可以通过刷新页面或进入设置页面重试
- 不影响其他应用功能（如历史聊天记录浏览）

**权衡**：这是首次安装的预期行为，与优化前一致。

### 风险 4：测试覆盖不足

**描述**：快速路径和后台刷新可能缺乏充分的测试。

**缓解措施**：
- 单元测试覆盖所有分支（有缓存、无缓存、成功、失败）
- 集成测试验证完整的启动流程
- 手动测试：首次启动（无缓存）、正常启动（有缓存）、网络错误场景

**权衡**：增加测试代码量，但确保变更的正确性。

### 风险 5：性能回归

**描述**：后台刷新可能与应用初始化后的其他操作竞争资源。

**缓解措施**：
- 后台刷新是异步的，不阻塞主线程
- Redux 更新机制高效，单次更新开销 < 10ms
- 可选的优化：使用 `requestIdleCallback` 延迟触发（如果观察到问题）

**权衡**：目前风险较低，如有问题再优化。

## Migration Plan

### 部署步骤

1. **代码变更**：
   - 修改 `src/store/slices/modelProviderSlice.ts`
   - 修改 `src/main.tsx`
   - 更新测试文件

2. **测试验证**：
   - 运行单元测试：`pnpm test src/__test__/store/slices/modelProviderSlice.test.ts`
   - 运行集成测试：`pnpm test:integration`
   - 手动测试场景：
     - 首次启动（清除缓存）
     - 正常启动（有缓存）
     - 网络错误场景

3. **代码审查**：
   - 检查代码是否符合规范
   - 验证测试覆盖率
   - 确认文档更新

4. **合并发布**：
   - 合并到主分支
   - 构建生产版本
   - 发布新版本

### 回滚策略

如果发现严重问题：

1. **立即回滚**：恢复到变更前的代码
2. **清除缓存**：引导用户清除缓存（如需要）
3. **发布修复版本**：修复问题后重新发布

**回滚触发条件**：
- 应用启动失败率显著上升
- 用户报告严重的功能性问题
- 性能指标未达到预期

### 监控指标

建议监控以下指标（如果已有监控系统）：

1. **启动时间**：有缓存场景的 P50、P95、P99
2. **缓存命中率**：使用快速路径的比例
3. **后台刷新成功率**：远程请求成功的比例
4. **错误率**：无缓存且远程失败的比例

## Open Questions

**Q1: 是否需要在 UI 中显示数据来源（缓存 vs 远程）？**

**当前决定**：不需要。理由：
- 用户不需要关心数据来源
- 后台刷新通常在几秒内完成，数据来源会快速变化
- `lastUpdate` 字段已提供足够的信息

**Q2: 是否需要添加缓存新鲜度指示器（如 "数据可能过期"）？**

**当前决定**：不需要。理由：
- 增加UI 复杂度
- 后台刷新确保数据很快更新
- 用户可以手动刷新查看最新数据

**Q3: 是否需要支持离线模式（完全无网络时使用缓存）？**

**当前决定**：不需要。理由：
- 当前应用依赖网络（聊天功能需要网络）
- 缓存机制已经提供了基本的离线能力
- 离线模式需要更多设计和实现工作

**Q4: 后台刷新是否需要限流（如最多每 5 分钟一次）？**

**当前决定**：不需要。理由：
- 后台刷新只在启动时触发一次
- 用户手动刷新不受影响
- 限流会增加复杂度，当前场景不需要
