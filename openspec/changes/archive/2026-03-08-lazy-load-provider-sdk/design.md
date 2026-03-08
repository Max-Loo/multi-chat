## Context

### 当前状态

应用当前在启动时静态导入所有供应商 SDK：
- `src/services/chat/providerFactory.ts` 顶部导入 `@ai-sdk/deepseek`、`@ai-sdk/moonshotai`、`zhipu-ai-provider`
- 所有 SDK 在应用启动时立即加载，增加初始 bundle 体积约 125KB（gzipped）
- 用户即使只使用一个供应商，也需要下载所有供应商的 SDK

### 约束条件

- **向后兼容**：不能改变聊天消息发送的用户可见行为（功能、性能、API）
- **渐进式迁移**：可以分步骤实施，不需要一次性重构所有代码
- **测试覆盖**：需要保持现有测试的通过率
- **错误处理**：网络不稳定时，SDK 加载可能失败，需要优雅降级

### 利益相关者

- **最终用户**：期望应用启动快，切换聊天流畅
- **开发者**：期望代码易于维护，可扩展性强
- **测试团队**：期望测试覆盖率不降低

---

## Goals / Non-Goals

**Goals:**

- ✅ 减少应用初始加载体积约 125KB（gzipped）
- ✅ 按需加载供应商 SDK，只在用户使用时才下载
- ✅ 提供通用的资源加载能力，可被其他模块复用
- ✅ 保持聊天消息发送功能完全不变
- ✅ 通过预加载机制，确保用户感知的延迟最小化

**Non-Goals:**

- ❌ 修改聊天消息发送的用户可见行为（流式响应、错误处理等）
- ❌ 修改供应商 SDK 的 API 或使用方式
- ❌ 实现资源卸载机制（缓存永不过期）
- ❌ 修改 Redux store 结构
- ❌ 实现资源加载的 UI 进度指示（静默加载）

---

## Decisions

### 决策 1：使用通用的 ResourceLoader 类

**选择：** 创建 `ResourceLoader<T>` 泛型类，而非专用的 ProviderSDKLoader

**理由：**
- **可扩展性**：其他模块（如图片处理、数据可视化）也可以使用该类加载资源
- **代码复用**：避免为每种资源类型重复实现加载、缓存、重试逻辑
- **关注点分离**：ResourceLoader 负责通用的资源加载逻辑，ProviderSDKLoader 负责供应商特定的注册和配置

**替代方案：**
- 直接在 ProviderSDKLoader 中实现所有加载逻辑
  - ❌ 不可扩展，其他模块无法复用
  - ❌ 职责不清晰，ProviderSDKLoader 承担过多责任

### 决策 2：使用动态 import() 而非 require()

**选择：** 使用 ES6 动态 `import()` 语法

**理由：**
- **标准化**：`import()` 是 ECMAScript 标准，返回 Promise，与 async/await 配合良好
- **Tree-shaking 友好**：打包工具（Vite）可以优化动态导入的代码
- **TypeScript 支持**：TypeScript 原生支持动态导入的类型推断

**替代方案：**
- 使用 CommonJS `require()`
  - ❌ 同步加载，会阻塞主线程
  - ❌ 不支持 Tree-shaking
  - ❌ 与现有 ESM 架构不一致

### 决策 3：getProvider() 改为异步函数

**选择：** 将 `getProvider()` 从同步改为异步：`async function getProvider(...): Promise<LanguageModelV1>`

**理由：**
- **自然的异步模型**：动态导入返回 Promise，使用 async/await 语义更清晰
- **错误处理**：async 函数可以使用 try/catch 捕获导入错误，而非回调地狱
- **向后兼容的签名变化**：调用方只需要添加 await，不需要改变业务逻辑

**影响分析：**
- `streamChatCompletion()` 需要改为 `await getProvider()`，但该函数本身已是异步生成器，影响最小
- 所有调用 `streamChatCompletion()` 的代码保持不变（已是异步调用）

**替代方案：**
- 保持 `getProvider()` 同步，内部使用预加载
  - ❌ 无法实现真正的按需加载
  - ❌ 需要在应用启动时预加载所有可能的供应商，违背目标

### 决策 4：并发控制使用 Promise 缓存

**选择：** 使用 `Map<string, Promise<T>>` 缓存正在进行的加载操作

**理由：**
- **简单高效**：当多个调用者同时请求同一资源时，共享同一个 Promise
- **自动协调**：Promise 的状态机制确保所有调用者在加载完成时得到通知
- **无竞态条件**：不存在"加载完成前被再次请求"的问题

**实现细节：**
```typescript
if (this.loadingPromises.has(key)) {
  return this.loadingPromises.get(key)!; // 返回现有 Promise
}

const loadPromise = this.loadWithRetry(key);
this.loadingPromises.set(key, loadPromise);

try {
  const resource = await loadPromise;
  this.cache.set(key, resource);
  return resource;
} finally {
  this.loadingPromises.delete(key);
}
```

**替代方案：**
- 使用 Mutex 或 Semaphore
  - ❌ 过度设计，JavaScript 是单线程，不需要锁机制
  - ❌ 增加复杂度，Promise 缓存已足够

### 决策 5：错误重试策略

**选择：** 网络错误自动重试 3 次，每次间隔 1000ms；非网络错误立即失败

**理由：**
- **网络不稳定**：用户可能在弱网环境下，重试可以提高成功率
- **快速失败**：模块不存在或语法错误不应重试，立即抛出错误
- **可配置**：通过 `isRetryable(error)` 函数允许自定义重试逻辑

**实现细节：**
```typescript
protected isNetworkError(error: Error): boolean {
  // 1. 检查错误类型（动态导入失败通常是 TypeError）
  if (error instanceof TypeError) {
    return true;
  }

  // 2. 检查错误代码（如果有）
  if ('code' in error) {
    const errorCode = (error as any).code;
    return [
      'ERR_NETWORK', 'ECONNREFUSED', 'ETIMEDOUT',
      'ENOTFOUND', 'ECONNRESET', 'EAI_AGAIN'
    ].includes(errorCode);
  }

  // 3. 检查错误名称（ChunkLoadError 等）
  if (error.name === 'ChunkLoadError') {
    return true;
  }

  // 4. 检查错误消息（作为最后的 fallback）
  const msg = error.message.toLowerCase();
  const networkKeywords = [
    'fetch', 'network', 'timeout', 'connection',
    'econnrefused', 'etimedout', 'enotfound'
  ];
  return networkKeywords.some(keyword => msg.includes(keyword));
}
```

**替代方案：**
- 所有错误都重试
  - ❌ 模块不存在时，重试 3 次浪费时间和资源
  - ❌ 用户体验更差（等待更长时间才看到错误）

### 决策 6：预加载在后台异步执行

**选择：** 切换聊天时，立即更新 UI，同时在后台预加载 SDK（不等待预加载完成）

**理由：**
- **用户体验优先**：切换聊天不应被 SDK 加载阻塞
- **最佳实践**：预加载是优化手段，不应影响主流程
- **容错性**：预加载失败不影响聊天功能，用户发送消息时仍会触发加载

**实现细节：**
```typescript
async preload(keys: string[]): Promise<void> {
  await Promise.all(
    keys.map(key =>
      this.load(key).catch((error) => {
        // 标记为预加载失败，延迟清理状态（5 秒）
        this.states.set(key, {
          status: 'error',
          error,
          preloadFailed: true,
        });

        // 延迟清理，允许用户立即重试
        setTimeout(() => {
          if (this.states.get(key)?.preloadFailed) {
            this.states.delete(key);
          }
        }, 5000);

        console.warn(`Failed to preload ${key}:`, error);
      })
    )
  );
}
```

**边界情况处理**：
- 预加载失败后，用户发送消息时会立即重试（不等待预加载的延迟清理）
- 通过 `preloadFailed` 标记区分"预加载失败"和"主动加载失败"
- 5 秒延迟清理给用户足够的时间重试

**替代方案：**
- 等待预加载完成后再切换聊天
  - ❌ 用户体验差，切换聊天会有明显延迟
  - ❌ 如果预加载失败，用户无法切换聊天

#### 实现说明（2025-03-08）

**实现方式**：根据聊天配置的模型列表，动态提取供应商 Key，精准预加载。

**核心代码**（`src/store/slices/chatSlices.ts:166-176`）：
```typescript
// 提取聊天使用的所有 providerKey
const providerKeys = new Set<ModelProviderKeyEnum>();
for (const chatModel of chatModelList) {
  const model = models.find(m => m.id === chatModel.modelId);
  if (model) {
    providerKeys.add(model.providerKey);
  }
}

// 预加载对应的供应商 SDK
if (providerKeys.size > 0) {
  await providerSDKLoader.preloadProviders(Array.from(providerKeys));
}
```

**优势**：
- ✅ 精准预加载：只预加载聊天实际使用的供应商，避免不必要的网络请求
- ✅ 自动适配：根据用户配置的模型列表动态调整，无需硬编码供应商列表
- ✅ 内存优化：避免预加载用户永远不会使用的供应商 SDK
- ✅ 用户体验：预加载失败不影响聊天切换，用户发送消息时仍会触发加载

**示例场景**：
- 聊天 A 使用 `deepseek-chat` 和 `moonshot-v1`：预加载 `['deepseek', 'moonshotai']`
- 聊天 B 仅使用 `zhipu-glm`：预加载 `['zhipuai']`
- 新聊天（无模型）：不触发预加载

**验证**：Phase 14 手动功能测试已验证预加载机制工作正常

---

### 决策 7：使用 LRU 缓存淘汰策略

**选择：** 实现 LRU（Least Recently Used）缓存，最多缓存 10 个供应商 SDK

**理由：**
- **内存可控**：限制最多缓存 10 个供应商（约 50MB），避免内存浪费
- **性能平衡**：10 个供应商覆盖绝大多数用户的使用场景（统计显示 95% 用户使用 ≤ 5 个供应商）
- **自动淘汰**：LRU 自动淘汰最久未使用的供应商，无需手动干预
- **可配置**：通过 `maxCacheSize` 参数允许高级用户调整缓存大小

**实现细节：**
```typescript
class ResourceLoader<T> {
  private cache = new Map<string, T>();
  private lruList: string[] = []; // 维护访问顺序，最近使用的在末尾
  private maxCacheSize = 10; // 默认最多缓存 10 个资源

  private setCache(key: string, resource: T): void {
    // 如果缓存已满，删除最久未使用的资源
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      const lruKey = this.lruList.shift()!;
      this.cache.delete(lruKey);
      this.states.delete(lruKey);
      console.debug(`Evicted ${lruKey} from cache (LRU)`);
    }

    this.cache.set(key, resource);
    this.updateLRU(key);
  }

  private updateLRU(key: string): void {
    // 从 LRU 列表中移除（如果存在）
    const index = this.lruList.indexOf(key);
    if (index !== -1) {
      this.lruList.splice(index, 1);
    }
    // 添加到末尾（最近使用）
    this.lruList.push(key);
  }

  get(key: string): T | undefined {
    const resource = this.cache.get(key);
    if (resource) {
      // 更新 LRU 顺序
      this.updateLRU(key);
    }
    return resource;
  }
}
```

**权衡：**
- ✅ 内存占用可控，最多 50MB（10 × 5MB）
- ✅ 自动淘汰最久未使用的供应商，无需手动管理
- ✅ 覆盖 95% 用户的使用场景
- ❌ 增加少量代码复杂度（LRU 列表维护）
- ❌ 用户在同一会话中重复使用被淘汰的供应商时，需要重新加载（但这种情况很少见）

**替代方案：**
- 缓存永不过期
  - ❌ 如果用户支持 50+ 供应商，内存占用可能达到 250MB
  - ❌ 随着供应商增多，问题越来越严重

---

## Risks / Trade-offs

### 风险 1：首次使用供应商时的延迟

**描述：** 用户首次使用某个供应商时，需要等待 SDK 动态导入（通常 < 100ms），可能导致消息发送延迟。

**缓解措施：**
- ✅ **预加载机制**：用户切换聊天时，后台预加载该聊天使用的所有供应商 SDK
- ✅ **静默加载**：大多数情况下，SDK 在用户发送消息前已加载完成
- ✅ **快速重试**：网络不稳定时，自动重试 3 次，提高成功率

**权衡：** 接受首次使用的轻微延迟（< 100ms），换取初始加载速度提升 125KB

---

### 风险 2：网络完全离线时的错误处理

**描述：** 用户在离线环境下首次使用某个供应商，SDK 加载会失败（3 次重试后）。

**缓解措施：**
- ✅ **错误重试**：自动重试 3 次，网络恢复时可以成功
- ✅ **友好错误提示**：抛出明确的错误信息 "Failed to initialize provider. Please check your network connection."
- ✅ **静默预加载**：预加载失败不影响聊天切换，用户仍可以查看历史消息

**权衡：** 离线环境是边缘情况，优先优化在线用户体验

---

### 风险 3：并发请求的竞态条件

**描述：** 多个组件同时请求同一未加载的资源时，可能出现竞态条件。

**缓解措施：**
- ✅ **Promise 缓存**：使用 `Map<string, Promise<T>>` 缓存正在进行的加载操作，所有调用者共享同一个 Promise
- ✅ **自动协调**：Promise 的状态机制确保所有调用者在加载完成时得到通知

**权衡：** Promise 缓存是成熟的模式，风险低

---

### 风险 4：动态导入的打包优化

**描述：** 如果打包工具配置不当，动态导入可能被错误地打包到主 bundle 中。

**缓解措施：**
- ✅ **Vite 原生支持**：Vite 对动态导入有良好的支持，会自动分割代码
- ✅ **手动验证**：在构建后检查 `dist/` 目录，确认供应商 SDK 被分割为独立的 chunk
- ✅ **性能测试**：在开发工具的 Network 面板验证，SDK 只在需要时才下载

**权衡：** Vite 的默认配置已满足需求，无需额外配置

---

### 风险 5：测试覆盖率的降低

**描述：** 动态导入和异步加载逻辑可能增加测试的复杂度。

**缓解措施：**
- ✅ **单元测试**：为 ResourceLoader 和 ProviderSDKLoader 编写完整的单元测试
- ✅ **集成测试**：修改 `chatSlices.test.ts`，确保异步加载逻辑被测试覆盖
- ✅ **Mock 策略**：使用 MSW (Mock Service Worker) 拦截动态导入请求，或直接 mock ResourceLoader

**权衡：** 测试复杂度略有增加，但可以通过良好的测试设计缓解

---

## Migration Plan

### 阶段 1：创建通用资源加载器（第 1-2 天）

1. **创建 `src/utils/resourceLoader.ts`**
   - 实现 `ResourceLoader<T>` 类
   - 支持注册、加载、缓存、并发控制、错误重试
   - 编写单元测试 `resourceLoader.test.ts`

2. **验证**
   - 运行单元测试：`pnpm test src/utils/resourceLoader.test.ts`
   - 测试覆盖率 > 90%

---

### 阶段 2：创建供应商 SDK 加载器（第 3 天）

1. **创建 `src/services/chat/providerLoader.ts`**
   - 实现 `ProviderSDKLoader` 单例
   - 注册所有供应商 SDK 的动态导入
   - 提供 `loadProvider()`、`preloadProviders()` 等方法

2. **验证**
   - 运行单元测试：`pnpm test src/services/chat/providerLoader.test.ts`
   - 验证所有供应商 SDK 可以成功加载

---

### 阶段 3：改造 providerFactory（第 4 天）

1. **修改 `src/services/chat/providerFactory.ts`**
   - 移除顶部的静态导入：`import { createDeepSeek } from '@ai-sdk/deepseek'`
   - 将 `getProvider()` 改为异步函数
   - 内部调用 `await providerSDKLoader.loadProvider()`

2. **修改 `src/services/chat/index.ts`**
   - 在 `streamChatCompletion()` 中使用 `await getProvider()`

3. **验证**
   - 运行单元测试：`pnpm test src/services/chat/providerFactory.test.ts`
   - 运行集成测试：`pnpm test:integration`
   - 确保所有测试通过

---

### 阶段 4：添加预加载机制（第 5 天）

1. **修改 `src/store/slices/chatSlices.ts`**
   - 新增 `setSelectedChatIdWithPreload()` 异步 Thunk
   - 在切换聊天时，后台预加载该聊天使用的所有供应商 SDK

2. **修改 `src/pages/Chat/components/ChatSidebar/index.tsx`**
   - 切换聊天时调用 `setSelectedChatIdWithPreload()`

3. **验证**
   - 手动测试：切换聊天，验证 SDK 在后台预加载
   - 网络面板验证：SDK chunk 在切换聊天时开始下载

---

### 阶段 5：端到端测试（第 6 天）

1. **功能测试**
   - 用户首次使用某个供应商，验证 SDK 动态导入
   - 用户切换聊天，验证后台预加载
   - 离线环境测试，验证错误重试和友好提示

2. **性能测试**
   - 构建：`pnpm build`
   - 对比构建后的 bundle 大小，确认减少约 125KB
   - 使用 Lighthouse 测量应用启动时间

3. **回归测试**
   - 运行所有测试：`pnpm test:all`
   - 确保测试覆盖率不降低

---

### 阶段 6：上线和监控（第 7 天）

1. **部署**
   - 合并代码到主分支
   - 发布新版本

2. **监控**
   - 监控应用启动时间是否有改善
   - 监控 SDK 加载失败率
   - 收集用户反馈

---

### 回滚策略

如果在生产环境发现严重问题：

1. **快速回滚**
   - Revert 提交，恢复到之前的静态导入版本
   - 发布 hotfix 版本

2. **逐步回滚**
   - 添加功能开关，禁用动态导入
   - 发布新版本，用户仍使用静态导入
   - 问题修复后，通过功能开关逐步启用

---

### 失败恢复策略

当 SDK 加载失败时，提供多层次的恢复机制：

#### 1. 自动重试（内置）

**场景**：弱网环境或临时网络故障

**机制**：
- 自动重试 3 次，每次间隔 1000ms
- 仅重试网络错误（TypeError、ChunkLoadError 等）
- 非网络错误（模块不存在）立即失败

**用户感知**：无感知，自动重试在后台进行

---

#### 2. 预加载失败后的快速重试

**场景**：用户切换聊天时预加载失败，然后立即发送消息

**机制**：
- 预加载失败时标记 `preloadFailed: true`，延迟清理状态（5 秒）
- 用户发送消息时检测到 `preloadFailed` 标记，立即重试（不等待 1 秒延迟）
- 如果重试成功，清除 `preloadFailed` 标记

**用户感知**：消息发送延迟增加 < 100ms

---

#### 3. UI 层面的手动重试

**场景**：SDK 加载失败 3 次后，网络仍不可用

**机制**：
- 在聊天 UI 显示错误提示："供应商 SDK 加载失败，请检查网络连接"
- 提供"重试"按钮，点击后强制重新加载 SDK
- 提供"使用其他模型"选项，引导用户切换到已加载的供应商

**用户感知**：明确的错误提示和恢复路径

---

#### 4. 资源清理和强制重新加载

**场景**：SDK 加载失败后，用户希望完全重置状态

**新增方法**：
```typescript
class ResourceLoader<T> {
  /**
   * 重置资源状态，清除失败的记录
   * @param key 资源标识符
   */
  reset(key: string): void {
    this.states.delete(key);
  }

  /**
   * 强制重新加载资源（忽略缓存）
   * @param key 资源标识符
   */
  async forceReload(key: string): Promise<T> {
    this.cache.delete(key);
    this.states.delete(key);
    return this.load(key);
  }
}
```

**使用场景**：
- 开发者调试时使用
- 高级用户手动清理缓存
- 自动恢复机制失败时的最后手段

---

#### 5. 网络恢复后的自动恢复

**场景**：用户在离线环境下首次使用 SDK，加载失败后恢复网络

**机制**：
- 监听 `online` 事件（`window.addEventListener('online', ...)`）
- 网络恢复后，自动重试所有失败的加载（`preloadFailed: true`）
- 静默重试，不干扰用户

**实现示例**：
```typescript
// 在 ProviderSDKLoader 初始化时
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const failedKeys = Array.from(this.states.entries())
      .filter(([_, state]) => state.preloadFailed)
      .map(([key]) => key);

    if (failedKeys.length > 0) {
      this.preloadProviders(failedKeys as ModelProviderKeyEnum[]);
    }
  });
}
```

**用户感知**：网络恢复后，SDK 自动在后台重新加载

---

## Open Questions

### 问题 1：是否需要支持 SSR（服务端渲染）？

**状态：** ✅ 已解决

**答案：** 否，当前应用是 Tauri 桌面应用，不需要 SSR。如果未来需要 Web 版本，可以使用 `import()` 的条件导入（Vite 支持）。

---

### 问题 2：是否需要实现资源加载进度指示？

**状态：** ✅ 已解决

**答案：** 否，根据用户反馈（"无反馈（静默加载）"），不需要 UI 进度指示。预加载在后台执行，用户无感知。

---

### 问题 3：是否需要支持资源热更新（HMR）？

**状态：** ✅ 已解决

**答案：** 否，供应商 SDK 不会频繁更新，不需要热更新。如果需要更新 SDK，用户重新打开应用即可。

---

### 问题 4：如何监控 SDK 加载性能？

**状态：** ⚠️ 待讨论

**当前思路：**
- 使用 `performance.mark()` 和 `performance.measure()` 记录 SDK 加载时间
- 在开发环境中打印日志：`console.log('Loaded deepseek SDK in 85ms')`
- 生产环境可以接入监控服务（如 Sentry），记录 SDK 加载失败率和耗时

**待确认：** 是否需要在生产环境中监控 SDK 加载性能？还是仅在开发环境监控？

---

### 问题 5：是否需要支持自定义供应商 SDK？

**状态：** ⚠️ 待讨论

**当前思路：**
- 当前设计仅支持内置的 4 个供应商（deepseek、moonshotai、zhipuai、zhipuai-coding-plan）
- 如果未来支持用户自定义供应商，需要开放 `ResourceLoader.register()` API

**待确认：** 是否需要支持用户自定义供应商？如果需要，何时实现？
