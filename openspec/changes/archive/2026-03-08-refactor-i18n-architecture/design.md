# Design: 国际化架构重构

## Context

### 当前状态

当前国际化模块存在以下架构问题：

1. **配置源分散**:
   - `constants.ts`: `SUPPORTED_LANGUAGE_LIST`
   - `LanguageSetting.tsx`: `LANGUAGE_OPTIONS` (硬编码)
   - `i18n.ts`: `LANGUAGE_LABELS` (语言标签映射)
   - 添加新语言需要修改多处，容易遗漏

2. **Toast 显示不可靠**:
   - `i18n.ts` 动态导入 `sonner` 模块
   - 初始化时调用 `toastFunc?.info()`，但 `<Toaster />` 组件尚未挂载
   - 导致 Toast 消息静默失败，用户看不到语言迁移/降级提示

3. **语言持久化手动同步**:
   - `LanguageSetting.tsx` 手动调用 `localStorage.setItem()`
   - 容易遗漏或不一致
   - 违反单一职责原则（UI 组件关心持久化逻辑）

### 约束条件

- **语言**: 中文（简体）
- **向后兼容**: 不改变现有 API 和用户行为
- **无新增依赖**: 使用现有 `sonner`、`i18next`、`@reduxjs/toolkit`
- **性能影响**: 可忽略（内存 < 1 KB，执行时间 < 1ms）
- **测试**: 不影响现有测试逻辑

### 利益相关者

- **开发者**: 简化语言配置管理，减少重复代码
- **用户**: 更可靠的通知显示，语言切换更流畅

---

## Goals / Non-Goals

### Goals

- **统一配置源**: 建立 `LANGUAGE_CONFIGS` 作为唯一数据源，自动派生所需数据结构
- **可靠 Toast 显示**: 解决初始化时序问题，确保所有消息都能显示
- **自动持久化**: 通过 Middleware 消除手动同步代码，降低出错风险
- **代码简洁**: 移除废弃逻辑，提升可维护性

### Non-Goals

- **不引入新功能**: 不改变 `i18n-lazy-loading` 规范中的任何需求
- **不改变用户行为**: 语言切换、加载、缓存逻辑保持不变
- **不增加依赖**: 使用现有技术栈，不引入新库
- **不改变 API**: `changeAppLanguage()`、`getDefaultAppLanguage()` 等函数签名不变

---

## Decisions

### Decision 1: 使用 TypeScript readonly 确保配置不可变性

**选择**: 在 `constants.ts` 中定义 `LANGUAGE_CONFIGS` 为 `readonly` 数组

**原因**:
- 编译时类型检查，防止意外修改
- 清晰表达"常量"语义
- 自动派生 `SUPPORTED_LANGUAGE_LIST`、`SUPPORTED_LANGUAGE_SET`、`SUPPORTED_LANGUAGE_MAP`

**替代方案**:
- *Object.freeze()*: 运行时保护，但无类型检查
- *普通 const*: 可被意外修改

**实现**:
```typescript
export interface LanguageConfig {
  code: string;
  label: string;
  flag?: string;
}

export const LANGUAGE_CONFIGS: readonly LanguageConfig[] = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const;

// 自动派生
export const SUPPORTED_LANGUAGE_LIST = LANGUAGE_CONFIGS.map(c => c.code);
export const SUPPORTED_LANGUAGE_SET = new Set(SUPPORTED_LANGUAGE_LIST);
export const SUPPORTED_LANGUAGE_MAP = new Map(
  LANGUAGE_CONFIGS.map(c => [c.code, c])
);
```

---

### Decision 2: Toast 消息队列而非延迟加载

**选择**: 引入 `ToastQueue` 类管理消息生命周期

**原因**:
- **解决时序问题**: 初始化期间消息暂存，Toaster 挂载后统一显示
- **非阻塞**: 不等待 `sonner` 加载，保持初始化流程高效
- **可扩展**: 支持未来更复杂的消息管理（如优先级、去重）

**替代方案**:
- *延迟调用*: 等待 Toaster 挂载后再调用 toast（阻塞初始化流程）
- *同步渲染 Toaster*: 在 `main.tsx` 顶部同步渲染 `<Toaster />`（可能增加首屏加载时间）

**实现**:
```typescript
// src/lib/toastQueue.ts
interface QueuedToast {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  description?: string;
}

class ToastQueue {
  private queue: QueuedToast[] = [];
  private toastReady: boolean = false;
  private isFlushing: boolean = false;

  markReady() {
    this.toastReady = true;
    this.flush();
  }

  enqueue(toast: QueuedToast) {
    if (this.toastReady && !this.isFlushing) {
      this.show(toast);  // 仅当不在 flush 时才立即显示
    } else {
      this.queue.push(toast);
      // 如果 Toaster 已就绪但未在 flush，触发 flush
      if (this.toastReady && !this.isFlushing) {
        this.flush();
      }
    }
  }

  private async flush() {
    if (this.isFlushing) return;  // 防止重复调用
    this.isFlushing = true;
    try {
      while (this.queue.length > 0) {
        const toast = this.queue.shift();
        if (toast) {
          await this.show(toast);
          // 等待 500ms，确保用户有时间阅读每个消息
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }

  private async show(toast: QueuedToast) {
    const { toast } = await import('sonner');
    // 根据类型显示对应的 toast
    switch (toast.type) {
      case 'info':
        toast.info(toast.message, { description: toast.description });
        break;
      case 'success':
        toast.success(toast.message, { description: toast.description });
        break;
      case 'warning':
        toast.warning(toast.message, { description: toast.description });
        break;
      case 'error':
        toast.error(toast.message, { description: toast.description });
        break;
    }
  }
}

export const toastQueue = new ToastQueue();
```

**集成点**:
- `i18n.ts`: 使用 `toastQueue.enqueue()` 替代 `toastFunc?.info()`
- `main.tsx`: 初始化完成后调用 `toastQueue.markReady()`

---

### Decision 3: Redux Middleware 自动持久化

**选择**: 创建 `languagePersistence` middleware 监听 `setAppLanguage` action

**原因**:
- **关注点分离**: UI 组件不关心持久化逻辑
- **自动同步**: 不再需要手动调用 `localStorage.setItem()`
- **容错性**: localStorage 失败不影响应用运行（静默降级）

**替代方案**:
- *手动同步*: 继续在 `LanguageSetting.tsx` 中调用（容易遗漏）
- *Redux Listener*: 使用 `listenerMiddleware`（功能过剩，middleware 更简洁）

**实现**:
```typescript
// src/store/middleware/languagePersistence.ts
export const createLanguagePersistenceMiddleware = (): Middleware => {
  return (store) => (next) => (action) => {
    const result = next(action);

    // 使用 endsWith 匹配，兼容 Redux Toolkit 的环境前缀
    if (action.type.endsWith('/setAppLanguage')) {
      // 类型安全检查
      if (typeof action.payload === 'string') {
        try {
          localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, action.payload);
        } catch (error) {
          console.warn('[LanguagePersistence] 持久化失败:', error);
          // 静默降级，不抛出错误
        }
      } else {
        console.warn('[LanguagePersistence] 无效的语言代码:', action.payload);
      }
    }

    return result;
  };
};
```

**简化后的 `LanguageSetting.tsx`**:
```typescript
const onLangChange = async (lang: string) => {
  // ...
  if (success) {
    dispatch(setAppLanguage(lang));  // ← 只需这一行！
    // localStorage 自动持久化，无需手动调用
  }
  // ...
};
```

---

### Decision 4: 保留现有缓存机制，不引入 LRU

**选择**: 保持当前的永久缓存策略（`loadedLanguages` Set、`languageResourcesCache` Map）

**原因**:
- **文件大小可控**: 每个语言约 5-10 KB，支持 10+ 语言也仅 100 KB
- **YAGNI 原则**: 当前无需优化内存
- **简单高效**: O(1) 查询，无淘汰逻辑

**替代方案**:
- *LRU 缓存*: 复杂度高，收益不明显
- *定期清理*: 可能导致重复加载，用户体验差

---

## Risks / Trade-offs

### Risk 1: Toast 队列并发安全问题

**场景**: 在 `flush()` 执行期间调用 `enqueue()`，导致新消息与队列消息并发显示

**缓解措施**:
- 添加 `isFlushing` 标志防止重复 flush 调用
- 在 `enqueue()` 中检查 `isFlushing`，确保 flush 期间新消息正确排队
- 单元测试覆盖并发场景（flush 执行期间调用 enqueue）
- 集成测试验证消息顺序显示

**补充风险**: 消息堆积但 `markReady()` 从未被调用

**缓解措施**:
- 单元测试覆盖队列清空逻辑
- 集成测试验证 Toast 显示
- 代码审查确保 `main.tsx` 正确调用 `markReady()`

---

### Risk 2: localStorage 写入失败导致状态不一致

**场景**: 用户禁用 localStorage 或存储空间满

**缓解措施**:
- Middleware 静默降级，不抛出错误
- 下次启动使用默认语言逻辑（`getDefaultAppLanguage()`）
- 不影响当前会话的 Redux 状态

---

### Risk 3: 配置迁移遗漏

**场景**: 现有代码使用 `SUPPORTED_LANGUAGE_LIST` 或 `LANGUAGE_LABELS`

**缓解措施**:
- 全局搜索确认所有引用点（特别是 `global.ts` 中的 `getLanguageLabel()`）
- TypeScript 编译时检查（未定义的变量会报错）
- 分阶段迁移：先添加新配置、更新所有引用点、最后删除旧代码
- 单元测试验证 `getLanguageLabel()` 的返回值正确性

---

### Trade-off 1: 代码复杂度 vs 可靠性

**选择**: 引入 `ToastQueue` 增加约 50 行代码

**权衡**:
- **成本**: 新增一个类和多个调用点
- **收益**: Toast 显示从"不可靠"变为"100% 可靠"

**结论**: 收益远大于成本

---

### Trade-off 2: 运行时计算 vs 预计算

**选择**: 在 `constants.ts` 中预计算 `SUPPORTED_LANGUAGE_SET` 和 `SUPPORTED_LANGUAGE_MAP`

**权衡**:
- **预计算**: 模块加载时执行一次，O(1) 查询
- **运行时计算**: 每次调用时计算，O(n) 查询

**结论**: 预计算性能更优（Set.has O(1) vs Array.includes O(n)）

---

## Migration Plan

### Phase 1: 基础重构（无风险）

**目标**: 统一语言配置源

**步骤**（必须按顺序执行）:
1. 在 `constants.ts` 中添加 `LANGUAGE_CONFIGS`
2. 派生 `SUPPORTED_LANGUAGE_LIST`、`SUPPORTED_LANGUAGE_SET`、`SUPPORTED_LANGUAGE_MAP`（← **必须在步骤 4 之前完成**）
3. 更新 `global.ts` 中的 `getLanguageLabel()` 使用 `SUPPORTED_LANGUAGE_MAP`（添加降级逻辑）
4. 更新 `LanguageSetting.tsx` 从 `SUPPORTED_LANGUAGE_LIST` 派生选项
5. 删除 `LanguageSetting.tsx` 中的硬编码 `LANGUAGE_OPTIONS`

**验证**:
- TypeScript 编译通过
- 语言选择器显示正常
- 添加新语言只需修改 `constants.ts`
- `global.ts` 中的 `getLanguageLabel()` 正常工作（包括对未知语言代码的降级处理）

---

### Phase 2: Toast 可靠性（核心改进）

**目标**: 解决初始化时序问题

**步骤**:
1. 创建 `src/lib/toastQueue.ts`
2. 修改 `i18n.ts` 使用 `toastQueue.enqueue()` 替代 `toastFunc?.info()`
3. 删除旧的动态导入 toast 逻辑
4. 修改 `main.tsx` 在 Toaster 挂载后调用 `toastQueue.markReady()`

**验证**:
- 初始化时 Toast 正常显示（语言迁移、降级提示）
- 运行时语言切换 Toast 正常显示
- 消息队列在 `markReady()` 后正确清空

---

### Phase 3: 自动持久化（锦上添花）

**目标**: 消除手动同步代码

**步骤**:
1. 创建 `src/store/middleware/languagePersistence.ts`
2. 在 `src/store/index.ts` 中集成 middleware
3. 简化 `LanguageSetting.tsx`，移除 `localStorage.setItem()` 调用
4. 删除 `global.ts` 中重复的 `LOCAL_STORAGE_LANGUAGE_KEY` 定义（如有）

**验证**:
- 语言切换后 localStorage 正确更新
- localStorage 写入失败时应用正常运行
- Redux 状态与 localStorage 同步

---

### Phase 4: 清理和测试

**目标**: 移除废弃代码，确保测试覆盖

**步骤**:
1. 全局搜索确认无遗漏的旧代码引用
2. 更新相关测试文件（如有）
3. 添加单元测试：`ToastQueue`、`languagePersistence` middleware
4. 手动测试所有语言切换场景

**回滚策略**:
- 使用 Git 分支隔离重构
- 每个 Phase 独立 commit，便于快速回滚
- 保留重构前的代码备份（至少 1 个发布周期）

---

## Open Questions

### Q1: 是否需要支持区域变体（如 `zh-CN`, `zh-TW`）？

**当前决策**: 否（仅支持语言代码 `zh`, `en`, `fr`）

**未来扩展**: 如需支持，可扩展 `LanguageConfig` 接口：
```typescript
interface LanguageConfig {
  code: string;
  label: string;
  flag?: string;
  variants?: LanguageVariant[];  // 新增
}
```

---

### Q2: Toast 队列是否需要优先级机制？

**当前决策**: 否（FIFO 队列）

**未来扩展**: 如需支持，可扩展 `QueuedToast` 接口：
```typescript
interface QueuedToast {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  description?: string;
  priority?: number;  // 新增：数字越大优先级越高
}
```

---

### Q3: 是否需要添加语言配置的运行时验证？

**当前决策**: 否（TypeScript 编译时验证足够）

**未来扩展**: 如需支持，可添加运行时断言：
```typescript
export function validateLanguageConfig(config: LanguageConfig): boolean {
  return !!config.code && config.code.length === 2;
}
```

---

## Appendix: 架构图

### 数据流图（重构后）

```
LANGUAGE_CONFIGS (constants.ts)
    ↓
派生: SUPPORTED_LANGUAGE_LIST, Set, Map
    ↓
├─→ global.ts: getDefaultAppLanguage()
├─→ i18n.ts: getLanguageLabel()
└─→ LanguageSetting.tsx: 语言选项
```

### Toast 时序图（重构后）

```
i18n 初始化 → toastQueue.enqueue(msg)
    ↓
main.tsx 渲染 Toaster
    ↓
toastQueue.markReady()
    ↓
import('sonner') + 显示所有消息
```

### 持久化流程（重构后）

```
用户切换语言 → dispatch(setAppLanguage)
    ↓
languagePersistence middleware 监听
    ↓
localStorage.setItem() 自动执行
```
