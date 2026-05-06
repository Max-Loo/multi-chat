# 模块状态重置规范

## 概述

每个持有模块级可变状态的模块必须提供 `resetForTest()` 函数，用于在测试之间精确清理内部状态。测试基础设施在 `afterEach` 中统一调用这些函数，替代进程级隔离策略。

## 约束

### M1: 每个有状态模块必须提供 resetForTest()

任何在模块顶层持有可变状态（`let` 变量、`Map`/`Set` 缓存、单例实例、外部资源连接）的模块，必须导出一个 `resetForTest()` 函数，将该模块的全部可变状态恢复为初始值。

**判定标准**：如果模块顶层存在以下任一模式，则被视为"有状态"：
- `let xxx: T | null = null`（可变单例引用）
- `const xxx = new Map()` / `new Set()`（累积缓存）
- `const xxx = createLazyStore(...)` / `new SomeClass()`（导入时创建的实例）
- `const xxx: T = await someAsyncInit()`（顶层 await 初始化）

**例外**：`const` 绑定到不可变值（如 `isTestEnvironment()` 返回的 boolean）不需要 reset。

### M2: resetForTest() 必须清理全部状态

`resetForTest()` 不得遗漏任何内部可变状态。如果模块有 N 个可变变量/缓存，reset 函数必须清理全部 N 个，而非其中一部分。

**示例**：`i18n.ts` 有 4 个可变状态（`loadedLanguages`、`loadingPromises`、`languageResourcesCache`、`initI18nPromise`），其 reset 函数必须全部清理，而非仅重置 `initI18nPromise`。

### M3: 延迟初始化优于导入时初始化

新代码中，持有外部资源连接（IndexedDB、WebSocket、文件句柄等）的单例应采用延迟初始化模式：

```typescript
// 推荐：延迟初始化
let store: StoreCompat | null = null;
function getStore(): StoreCompat {
  if (!store) store = createLazyStore('data.json');
  return store;
}
export function resetStore() { store?.close(); store = null; }

// 不推荐：导入时立即创建
const store = createLazyStore('data.json');  // 导入即触发 IndexedDB 连接
```

**理由**：导入时初始化在测试中无法控制"是否初始化"，只能通过 mock 整个模块来阻止。延迟初始化让测试可以选择性地使用真实实现或 mock。

### M4: window/process 事件监听器必须可移除

如果在模块初始化时注册了 `window.addEventListener()` 或 `process.on()`，必须在 `resetForTest()` 中移除这些监听器。推荐使用 `AbortController` 模式：

```typescript
const controller = new AbortController();
window.addEventListener('online', handler, { signal: controller.signal });

export function resetForTest() {
  controller.abort();  // 一次性移除所有通过此 controller 注册的监听器
}
```

### M5: resetForTest() 在 cleanup 中统一调用

所有 `resetForTest()` 函数在 `setup/cleanup.ts` 的 `afterEach` 中统一调用，个别测试文件不需要自行调用。调用顺序与依赖关系相反（消费者先 reset，依赖后 reset）。

**理由**：集中管理避免个别测试遗漏 reset 调用，确保所有测试获得一致的隔离保证。

### M6: resetForTest() 不破坏正常功能

`resetForTest()` 仅在测试环境中使用（函数名明确标注），但设计上应保证：即使在非测试环境中误调用，也不会导致数据丢失或不可恢复的状态。推荐的实现是关闭连接 + 置 null（下次访问时重新初始化），而非删除持久化数据。
