# 语言降级持久化修复设计

## Context

### 当前状态
- `getDefaultAppLanguage()` 负责语言检测，包括从 localStorage 读取、验证缓存有效性、执行迁移、降级到系统语言或默认英语
- `initI18n()` 负责初始化 i18next 实例，包括调用语言检测、显示 Toast 提示、加载语言资源
- 当缓存语言无效时，`getDefaultAppLanguage()` 会删除缓存并返回降级语言，但不会持久化该降级语言

### 问题
- 删除无效缓存后，降级语言仅在内存中返回
- Redux store 初始化需要时间，在此之前用户刷新页面会重复触发降级逻辑
- 每次刷新都会显示降级 Toast 提示，影响用户体验

### 约束条件
- 不能修改 `getDefaultAppLanguage()` 的职责（语言检测）
- 需要保持现有架构的职责分离
- 确保向后兼容，不破坏现有功能

## Goals / Non-Goals

**Goals:**
- 修复 Redux middleware 让它在初始化时也能持久化语言
- 统一所有语言变更的持久化逻辑到 middleware 层
- 遵循设计文档 `docs/design/i18n-system.md` 定义的架构
- 提升用户体验，减少不必要的 Toast 提示

**Non-Goals:**
- 修改 `getDefaultAppLanguage()` 的职责范围
- 重构语言检测的整体架构
- 修改 i18n 初始化流程

## Decisions

### 决策 1：修复 Redux middleware 而非绕过它

**选择理由：**
- **架构一致性**：符合 `docs/design/i18n-system.md:162-194` 定义的架构设计
- **职责清晰**：所有持久化逻辑统一在 middleware 层，不分散
- **参考现有模式**：`chatMiddleware` 已经展示了如何同时监听 async thunk 和 reducer actions
- **可维护性高**：集中管理持久化逻辑，更容易理解和调试

**问题根源分析：**
```
初始化流程:
1. initI18n() 执行
   ├─ 调用 getDefaultAppLanguage() → 返回降级语言
   ├─ ❌ 直接写入 localStorage（绕过 Redux）
   └─ 初始化 i18next

2. store.dispatch(initializeAppLanguage())
   ├─ 调用 getDefaultAppLanguage()（第二次调用！）
   ├─ state.language = 降级语言
   └─ 派发 action: 'appConfig/language/initialize/fulfilled'
      ❌ middleware 不监听此 action
      ❌ localStorage 不会被写入
```

**其他考虑方案：**
- 方案 A：在 `initI18n()` 中持久化 → ❌ 违反架构设计，绕过 Redux store
- 方案 B：在 `getDefaultAppLanguage()` 中持久化 → ❌ 违背单一职责原则，检测和持久化耦合
- 方案 C：双重保险（initI18n + middleware）→ ❌ 持久化逻辑分散，维护困难

### 决策 2：扩展 middleware 监听多个 actions

修改 `appConfigMiddleware` 让它同时监听：
1. `setAppLanguage` - 用户主动切换语言
2. `initializeAppLanguage.fulfilled` - 初始化时语言降级

```typescript
// 修改前
saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setAppLanguage,  // ❌ 只监听用户主动切换
  ),
  // ...
})

// 修改后
saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setAppLanguage,                      // ✅ 用户主动切换
    initializeAppLanguage.fulfilled,     // ✅ 初始化时降级
  ),
  effect: async (action, listenerApi) => {
    // 根据 action 类型选择数据源，确保持久化的值准确可靠
    // - initializeAppLanguage.fulfilled: 使用 action.payload（直接来自 thunk 返回值，更可靠）
    // - setAppLanguage: 使用 store 中的值（可能有其他中间件或 reducer 修改）
    const isInitializeFulfilled = initializeAppLanguage.fulfilled.match(action);
    const langToPersist = isInitializeFulfilled
      ? action.payload as string
      : listenerApi.getState().appConfig.language;

    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, langToPersist);

    // 只在用户主动切换时显示 Toast
    if (action.type === 'appConfig/setAppLanguage') {
      // ... Toast logic
    }
  },
})
```

**选择理由：**
- 参考 `chatMiddleware.ts:82-90` 的成熟模式
- 统一在 middleware 处理所有语言变更的持久化
- 根据不同 action 类型决定是否显示 Toast
- **数据源选择优化**：根据 action 类型选择数据源，确保持久化值准确
  - `initializeAppLanguage.fulfilled`：使用 `action.payload`（直接来自 thunk 返回值，更可靠）
  - `setAppLanguage`：使用 `state.language`（可能有其他中间件或 reducer 修改了值）
- **避免时序问题**：不依赖 extraReducers 的更新顺序，直接使用 action.payload 保证了值的正确性

### 决策 3：移除 `initI18n()` 中的 localStorage 写入

删除 `src/lib/i18n.ts:204-213` 的代码：

```typescript
// ❌ 删除这段代码
if (languageResult.fallbackReason) {
  try {
    window?.localStorage?.setItem(LOCAL_STORAGE_LANGUAGE_KEY, languageResult.lang);
  } catch (error) {
    console.warn(`[i18n] Failed to persist fallback language "${languageResult.lang}" to localStorage:`, error);
  }
}
```

**理由：**
- Redux middleware 会自动处理所有持久化
- 避免绕过 Redux 直接操作 localStorage
- 遵循单一数据源原则（Redux store 是唯一真实来源）

### 决策 4：合并两个 language middleware

**当前状态**：
- `appConfigMiddleware` (Listener Middleware)：监听 `setAppLanguage`，显示 Toast 并调用 `changeAppLanguage()`
- `languagePersistence` (普通 Middleware)：监听 `setAppLanguage`，写入 localStorage

**问题**：
- 两个 middleware 监听同一个 action，逻辑重复
- 持久化逻辑分散在两处，难以维护
- 不符合 DRY 原则

**解决方案**：
删除 `languagePersistence.ts`，将其功能合并到 `appConfigMiddleware`：

```typescript
// ❌ 删除 src/store/middleware/languagePersistence.ts

// ✅ appConfigMiddleware 现在负责所有语言相关的副作用
saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setAppLanguage,                      // 用户主动切换
    initializeAppLanguage.fulfilled,     // 初始化时降级
  ),
  effect: async (action, listenerApi) => {
    // 1. 持久化到 localStorage（原 languagePersistence 的功能）
    const langToPersist = action.type.endsWith('/fulfilled')
      ? action.payload
      : listenerApi.getState().appConfig.language;

    try {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, langToPersist);
    } catch (error) {
      console.warn('[LanguagePersistence] 持久化失败:', error);
      // 静默降级，不抛出错误
    }

    // 2. 根据场景决定是否显示 Toast（原 appConfigMiddleware 的功能）
    if (action.type === 'appConfig/setAppLanguage') {
      const loadingToast = await toastQueue.loading('切换语言中...');
      const result = await changeAppLanguage(langToPersist);
      toastQueue.dismiss(loadingToast);

      if (result.success) {
        toastQueue.success('语言切换成功');
      } else {
        toastQueue.error(`语言切换失败: ${langToPersist}`);
      }
    }
  },
})
```

**理由**：
- **统一职责**：所有语言相关的副作用（持久化 + 用户反馈）都在一个 middleware
- **逻辑集中**：更容易理解和维护
- **减少重复**：避免两个 middleware 监听同一个 action
- **类型安全**：Listener Middleware 提供更好的 TypeScript 支持

**影响的文件**：
- 删除：`src/store/middleware/languagePersistence.ts`
- 修改：`src/store/middleware/appConfigMiddleware.ts`
- 修改：`src/store/index.ts`（移除 `createLanguagePersistenceMiddleware()` 的引用）

### 决策 5：保留 initI18n() 中的降级 Toast

**选择**：保留 `src/lib/i18n.ts:203-225` 的降级 Toast 提示逻辑，不删除。

**理由：**
- **用户知情权**：语言自动降级是重要的系统行为，用户需要知道语言已切换
- **调试友好**：Toast 提示帮助用户和开发者理解系统语言决策
- **迁移透明性**：语言代码迁移（如 `zh-CN` → `zh`）需要告知用户
- **避免困惑**：无提示的自动降级会让用户困惑为什么语言改变了

**Toast 场景分类**：
```typescript
// ✅ 保留在 initI18n() 中的降级 Toast（初始化自动行为）
if (languageResult.migrated && languageResult.from) {
  // 迁移成功：告知用户语言代码已更新
  toastQueue.info(`Language code updated to ${getLanguageLabel(languageResult.lang)} (${languageResult.lang})`);
} else if (languageResult.fallbackReason === "system-lang") {
  // 降级到系统语言：告知用户使用系统语言
  toastQueue.info(`Switched to system language: ${getLanguageLabel(languageResult.lang)}`);
} else if (languageResult.fallbackReason === "default") {
  // 降级到默认英语：警告用户语言代码无效
  toastQueue.warning(`Language code invalid, switched to English`);
}

// ✅ 保留在 middleware 中的用户切换 Toast（用户主动操作）
effect: async (action, listenerApi) => {
  // 1. 持久化到 localStorage
  const langToPersist = action.type.endsWith('/fulfilled')
    ? (action.payload as string)
    : listenerApi.getState().appConfig.language;

  try {
    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, langToPersist);
  } catch (error) {
    console.warn('[LanguagePersistence] 持久化失败:', error);
  }

  // 2. 只在用户主动切换时显示 Toast
  if (action.type === 'appConfig/setAppLanguage') {
    const loadingToast = await toastQueue.loading('切换语言中...');
    const result = await changeAppLanguage(langToPersist);
    toastQueue.dismiss(loadingToast);

    if (result.success) {
      toastQueue.success('语言切换成功');
    } else {
      toastQueue.error(`语言切换失败: ${langToPersist}`);
    }
  }
  // initializeAppLanguage.fulfilled 不显示 Toast（已在 initI18n 中处理）
}
```

**职责分离**：
- **`initI18n()`**：处理初始化时的自动降级 Toast（自动行为，告知用户）
- **`appConfigMiddleware`**：处理用户主动切换的 Toast（用户操作，提供反馈）

**影响：**
- ✅ 初始化时的语言降级会显示 Toast（用户知情）
- ✅ 用户主动切换语言时的 Toast 体验保持不变（loading + success/error）
- ✅ 缓存有效时不显示 Toast（无冗余提示）
- ⚠️ 降级和迁移时各显示一次 Toast（可以接受，因为都是重要信息）

## Risks / Trade-offs

### Risk 1: `initializeAppLanguage` 重复调用 `getDefaultAppLanguage()`

**场景**：
1. `initI18n()` 调用 `getDefaultAppLanguage()` - 第一次
2. `initializeAppLanguage` thunk 又调用 `getDefaultAppLanguage()` - 第二次

**影响**：
- 轻微性能浪费（重复计算）
- 理论上可能返回不同结果（race condition，概率极低）

**评估**：
- `getDefaultAppLanguage()` 主要是读取 localStorage 和检测系统语言，性能开销小
- 两次调用间隔很短（在同一初始化流程中），结果几乎总是相同
- 可接受，无需额外处理

**未来优化**（可选）：
- 让 `initializeAppLanguage` 接受一个可选参数，避免重复调用
- 或者让 `initI18n()` 从 Redux store 读取语言而非自己调用 `getDefaultAppLanguage()`

### Risk 2: middleware 重复写入 localStorage

**场景**：同一个语言值被多次写入

**影响**：
- 相同值的重复写入操作
- 性能影响可忽略

**结论**：
- localStorage.setItem 对相同值的写入开销很小
- 不需要额外处理

### Risk 2.1: middleware 数据源选择不当导致持久化错误

**场景**：middleware 从 store 读取语言值，但 store 可能尚未更新或被其他逻辑修改

**问题分析**：
- 对于 `initializeAppLanguage.fulfilled`：extraReducers 会更新 `state.language = action.payload`
- 如果 middleware 从 store 读取，依赖 extraReducers 先执行
- 如果 future refactoring 改变了更新顺序，可能导致持久化错误的值

**缓解措施**：
- **使用 action.payload**：对于 fulfilled actions，直接使用 `action.payload` 而非从 store 读取
- **数据源选择策略**：
  ```typescript
  const langToPersist = action.type.endsWith('/fulfilled')
    ? action.payload                      // ✅ 直接使用 action.payload
    : listenerApi.getState().appConfig.language;  // ✅ 从 store 读取
  ```
- **不依赖 extraReducers 顺序**：即使 extraReducers 逻辑改变，持久化仍然正确

**优点**：
- 更可靠：直接使用 action 的 payload，不依赖中间状态
- 更清晰：明确表达"初始化使用 payload，切换使用 state"的意图
- 更易维护：future refactoring 不会破坏持久化逻辑

### Risk 3: 保留初始化降级 Toast 可能造成提示过多

**场景**：
- 用户设置了无效语言代码（如 'de'）
- 刷新页面后自动降级到系统语言或英文
- **显示 Toast 提示告知用户**（已解决）

**影响**：
- ✅ 用户清楚地知道语言已切换，不再困惑
- ⚠️ 可能每次刷新都显示 Toast（但仅在降级时触发，降级后会持久化）

**缓解措施**：
1. **✅ 保留降级 Toast**：用户明确知道语言已切换
2. **✅ 只在必要时显示**：降级、迁移时显示，缓存有效时不显示
3. **✅ 持久化降级语言**：middleware 确保降级后不再重复 Toast（只在首次降级时显示）
4. **✅ 保持控制台日志**：`getDefaultAppLanguage()` 的 console.warn 保留

**评估**：
- 语言降级虽然是**自动行为**，但会影响用户体验
- **显示 Toast 是更好的选择**：用户知情优先于"自动行为不提示"原则
- 持久化机制确保降级只在首次发生时显示一次
- 符合"透明性优先"的设计原则

### Risk 4: 测试用例需要更新

**影响**：现有的测试用例期望降级后 localStorage 为 `null`

**缓解措施**：
- 更新测试用例的期望值，验证降级语言被正确持久化
- 确保测试覆盖不同的降级场景（系统语言、默认英语）

## Migration Plan

### 部署步骤
1. 修改 `src/store/middleware/appConfigMiddleware.ts`：
   - 在 `matcher` 中添加 `initializeAppLanguage.fulfilled`
   - 修改 `effect` 函数，根据 action 类型决定是否显示 Toast
   - 添加 localStorage 持久化逻辑（从 `languagePersistence.ts` 合并过来）
   - 根据 action 类型选择数据源（payload vs state）
2. 删除 `src/store/middleware/languagePersistence.ts`（功能已合并到 `appConfigMiddleware`）
3. 修改 `src/store/index.ts`：
   - 移除 `import { createLanguagePersistenceMiddleware }` 的引用
   - 从 middleware 链中移除 `.concat(createLanguagePersistenceMiddleware())`
4. 删除 `src/lib/i18n.ts` 中的副作用代码：
   - 删除 localStorage 写入逻辑（204-213 行）
   - 删除 Toast 提示逻辑（187-202 行）
5. 更新相关测试用例：
   - `src/__test__/lib/i18n.test.ts` - 移除 localStorage 和 Toast 相关测试
   - `src/__test__/lib/global.test.ts` - 保持不变
   - `src/__test__/store/middleware/appConfigMiddleware.test.ts` - 添加初始化持久化测试
   - 删除 `src/__test__/store/middleware/languagePersistence.test.ts`（如果存在）
6. 执行测试确保所有场景通过
7. 代码审查后合并到主分支

### 回滚策略
- 通过 Git revert 可以快速回滚到之前的实现
- 不涉及数据迁移或 API 变更，回滚风险低

## Open Questions

无。该修改范围明确，技术方案清晰，无未决问题。
