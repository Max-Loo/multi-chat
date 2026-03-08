## Context

### 当前实现
应用使用 i18next 和 react-i18next 进行国际化管理。当前实现在 `src/lib/i18n.ts` 中的 `getLocalesResources()` 函数使用 `import.meta.glob('../locales/**/*.json')` 加载所有支持的语言资源（en、zh、fr），总计 21 个 JSON 文件（3 种语言 × 7 个命名空间），约 15 KB。

### 当前架构
- **初始化流程**：应用启动时，i18n 初始化步骤（在 `src/config/initSteps.ts` 中定义）调用 `initI18n()`
- **资源加载**：`getLocalesResources()` 同步加载所有语言文件并聚合为 resources 对象
- **语言切换**：通过 Redux middleware 监听 `setAppLanguage` action，调用 `changeAppLanguage()` 切换语言

### 问题
1. **资源浪费**：即使用户系统语言为中文，也会加载法文资源，浪费约 5 KB 内存
2. **启动延迟**：加载所有语言增加启动时间，预计 50-100 ms
3. **扩展性差**：每新增一种语言，所有用户的初始加载量都会增加约 5 KB

### 约束条件
- 必须使用现有的 i18next 和 react-i18next 库（不引入新的 i18n 框架）
- 必须保持现有的 API 兼容性（`changeAppLanguage()` 等函数）
- 必须与现有的初始化系统集成（`InitializationManager`）
- 不能影响现有的语言切换用户体验

---

## Goals / Non-Goals

### Goals
- ✅ 实现语言级按需加载，减少 33%-67% 初始加载量（取决于系统语言）
- ✅ 英文资源"第一公民"：同步打包，确保网络故障时应用仍可启动
- ✅ 保持英文作为兜底语言，确保应用始终可用
- ✅ 实现语言切换时的懒加载和缓存机制
- ✅ 提供清晰的用户反馈（Toast 提示）
- ✅ 实现加载失败时的自动重试（2 次，指数退避）和降级到英文
- ✅ 避免快速切换语言时的竞态条件

### Non-Goals
- ❌ 命名空间级按需加载（如按 chat.json、model.json 等细粒度加载）
  - **理由**：收益小（仅节省 2.4 KB）但实现复杂度极高，性价比低
- ❌ 预加载其他语言（即使在空闲时间）
  - **理由**：用户可能永远不会切换到其他语言，预加载浪费带宽
- ❌ 语言资源压缩或 CDN 优化
  - **理由**：超出本次变更范围，属于独立的性能优化项目

---

## Decisions

### 决策 0：英文资源"第一公民"策略（核心架构决策）

**选择**：英文资源使用静态 import 同步打包到主 bundle，其他语言异步按需加载

**理由**：
- ✅ **可靠性**：即使网络完全故障，英文界面也可用（无外部依赖）
- ✅ **性能**：英文资源同步加载，零延迟启动
- ✅ **降级保证**：英文作为兜底语言，任何时候都不会加载失败
- ✅ **符合最佳实践**：关键资源内联，非关键资源延迟加载

**代码示例**：
```typescript
// 英文资源：静态导入（同步打包）
import enCommon from '../locales/en/common.json';
import enChat from '../locales/en/chat.json';
// ... 其他命名空间

const EN_RESOURCES = {
  common: enCommon,
  chat: enChat,
  // ...
};

// 初始化时直接添加（不依赖网络）
i18n.addResourceBundle('en', 'translation', EN_RESOURCES, true);

// 其他语言：动态导入
async function loadLanguage(lang: 'zh' | 'fr') {
  // 使用 import.meta.glob 按需加载...
}
```

**性能影响**：
- 主 bundle 增加：约 5 KB（英文资源）
- 初始网络请求：从 21 个文件 → 7 个文件（仅英文）
- 启动速度：英文资源零延迟，其他语言异步加载

---

### 决策 1：使用 Map 数据结构维护语言加载 Promise 缓存（避免竞态条件）

**选择**：使用 `Map<string, Promise<void>>` 存储进行中的语言加载请求，`Set<string>` 存储已加载语言

**理由**：
- ✅ **避免竞态条件**：快速切换语言时，重复请求同一语言会复用进行中的 Promise
- ✅ **O(1) 查找时间**：快速判断语言是否正在加载或已加载
- ✅ **简单可靠**：原生数据结构，无需额外依赖
- ✅ **内存高效**：仅存储语言代码字符串和 Promise 引用，内存占用可忽略

**代码示例**：
```typescript
const loadingPromises = new Map<string, Promise<void>>();
const loadedLanguages = new Set<string>(['en']); // 英文预标记为已加载

async function loadLanguage(lang: string, retries = 2): Promise<void> {
  // 1️⃣ 检查是否已加载
  if (loadedLanguages.has(lang)) {
    return; // 已加载，直接返回
  }

  // 2️⃣ 检查是否正在加载
  if (loadingPromises.has(lang)) {
    return loadingPromises.get(lang)!; // 复用进行中的 Promise
  }

  // 3️⃣ 创建加载 Promise
  const promise = performLoad(lang, retries);
  loadingPromises.set(lang, promise);

  try {
    await promise;
    loadedLanguages.add(lang);
  } finally {
    loadingPromises.delete(lang);
  }
}
```

**替代方案**：
- 仅使用 `Set<string>` 标记已加载语言
  - **拒绝理由**：无法避免快速切换时的重复请求，可能导致竞态条件

---

### 决策 2：使用 i18next 的 `addResourceBundle()` API 动态添加语言

**选择**：使用 `i18n.addResourceBundle(lang, 'translation', resources, true)` 动态添加语言资源

**理由**：
- ✅ **官方支持**：i18next 提供的标准 API，稳定可靠
- ✅ **深度合并**：第四个参数 `deep=true` 确保命名空间正确合并
- ✅ **即时生效**：添加后立即可用，无需重新初始化

**代码示例**：
```typescript
i18n.addResourceBundle('zh', 'translation', {
  common: { ... },
  chat: { ... },
  // ... 其他命名空间
}, true);
```

---

### 决策 3：initI18n() 去参数化，内部检测系统语言

**选择**：`initI18n()` 不接受参数，内部调用 `getDefaultAppLanguage()` 检测系统语言

**理由**：
- ✅ **保持单例模式**：避免参数化初始化导致语义矛盾
- ✅ **简化调用**：调用者无需关心系统语言检测逻辑
- ✅ **向后兼容**：现有调用代码无需修改

**代码示例**：
```typescript
export const initI18n = async () => {
  if (initI18nPromise) {
    return initI18nPromise;
  }

  // 内部检测系统语言
  const systemLang = getDefaultAppLanguage();

  // 初始化逻辑...
  initI18nPromise = performInit(systemLang);
  return initI18nPromise;
};
```

**替代方案**：
- `initI18n(systemLang?: string)` 接受可选参数
  - **拒绝理由**：单例模式 + 参数化初始化 = 语义矛盾（见审查发现的问题 6）

---

### 决策 4：系统语言自动切换逻辑

**选择**：`initI18n()` 内部在系统语言加载完成后自动调用 `i18n.changeLanguage(systemLang)`

**理由**：
- ✅ **用户体验优先**：应用启动时显示用户熟悉的系统语言
- ✅ **无感知切换**：切换过程在后台进行，用户无需手动操作
- ✅ **降级安全**：如果系统语言加载失败，保持英文界面

**实现细节**：
```typescript
export const initI18n = async () => {
  // 1️⃣ 添加英文资源（同步）
  i18n.addResourceBundle('en', 'translation', EN_RESOURCES, true);

  // 2️⃣ 检测系统语言
  const systemLang = getDefaultAppLanguage();

  // 3️⃣ 如果系统语言不是英文，异步加载
  if (systemLang !== 'en') {
    try {
      await loadLanguage(systemLang);
      // 4️⃣ 加载成功，切换到系统语言
      await i18n.changeLanguage(systemLang);
    } catch (error) {
      // 5️⃣ 加载失败，保持英文，显示警告
      console.warn(`系统语言 ${systemLang} 加载失败，使用英文替代`, error);
      toast.error(`系统语言加载失败，已使用英文替代`);
    }
  }

  // 6️⃣ 初始化 i18next
  await i18n.init();
};
```

---

### 决策 5：重试策略（指数退避 + 错误类型判断）

**选择**：仅重试网络错误，使用指数退避策略（第一次 1s，第二次 2s）

**理由**：
- ✅ **智能重试**：区分网络错误和解析错误，避免无意义的重试
- ✅ **指数退避**：避免立即重试加重服务器负担
- ✅ **用户体验**：渐进式等待，避免频繁失败

**代码示例**：
```typescript
async function performLoad(lang: string, retries = 2): Promise<void> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await fetchLanguageResources(lang);
      return; // 成功，退出重试循环
    } catch (error) {
      const isNetworkError =
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout');

      // 非网络错误或已达重试上限，直接失败
      if (!isNetworkError || attempt === retries) {
        throw error;
      }

      // 指数退避：第一次 1s，第二次 2s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**错误类型判断**：
- **可重试**：网络错误（fetch、network、timeout）
- **不可重试**：解析错误、404（文件不存在）、JSON 格式错误

---

### 决策 6：加载失败时非阻塞降级到英文

**选择**：非阻塞降级（显示警告 Toast，但继续启动）

**理由**：
- ✅ **用户体验优先**：应用始终可用，不会因网络问题而白屏
- ✅ **透明反馈**：用户知情（Toast 警告），但不影响使用
- ✅ **符合最佳实践**：渐进增强（Progressive Enhancement）原则

**替代方案**：
- 阻塞启动，显示错误并要求用户重试
  - **拒绝理由**：过于严格，网络抖动会导致频繁的错误提示

---

### 决策 7：语言切换时的 Toast 反馈策略

**选择**：在 Redux middleware 中显示 Toast，而非组件内部

**理由**：
- ✅ **集中管理**：所有语言切换的反馈逻辑统一处理
- ✅ **代码简洁**：组件无需管理 loading 状态和 Toast 生命周期
- ✅ **一致性**：确保所有语言切换路径（设置、快捷键等）都有相同反馈

**实现位置**：`src/store/middleware/appConfigMiddleware.ts`

**Toast 导入方式**：
- ✅ **同步导入**：`import { toast } from 'sonner'`
- ❌ **动态导入**：`const { toast } = await import('sonner')`（错误处理中可能失败）

**理由**：Toast 库体积小（< 10 KB），同步导入可接受；同步导入避免错误处理时的额外依赖风险

**降级方案**：如果 Toast 库加载失败，使用 `console.warn()` 代替
```typescript
let toastFunc: typeof toast | null = toast;

function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  try {
    toastFunc?.[type]?.(message);
  } catch (error) {
    console.warn(`[Toast ${type}]`, message);
  }
}
```

---

### 决策 8：Vite import.meta.glob 的正确使用方式

**选择**：预先获取所有语言文件的映射，然后手动过滤目标语言的文件

**理由**：
- ✅ **Vite 限制**：`import.meta.glob` 不支持完全动态的路径（如 `../locales/${lang}/*.json`）
- ✅ **静态分析**：路径必须是静态可分析的字符串
- ✅ **灵活过滤**：运行时手动过滤需要的语言文件

**代码示例**：
```typescript
// ❌ 错误：Vite 不支持完全动态路径
const langModules = import.meta.glob(`../locales/${lang}/*.json`);

// ✅ 正确：预先获取所有映射，手动过滤
const allLocaleModules = import.meta.glob('../locales/**/*.json');

async function fetchLanguageResources(lang: string) {
  // 过滤出目标语言的文件
  const langFiles = Object.keys(allLocaleModules)
    .filter(path => path.match(new RegExp(`/locales/${lang}/[^/]+\\.json$`)));

  // 并行加载所有命名空间
  const resources = await Promise.all(
    langFiles.map(async (filePath) => {
      const module = await allLocaleModules[filePath]() as { default: Record<string, unknown> };
      // 提取命名空间（文件名）
      const namespace = filePath.match(/\/([^/]+)\.json$/)?.[1];
      return { namespace, resources: module.default };
    })
  );

  // 聚合为 i18next 格式
  return resources.reduce((acc, { namespace, resources }) => {
    acc[namespace] = resources;
    return acc;
  }, {} as Record<string, unknown>);
}
```

**技术细节**：
- Vite 在构建时会分析 `import.meta.glob` 的路径模式
- 生成的代码会为匹配的文件创建动态导入映射
- 运行时可以通过 key 访问对应的导入函数

---

### 决策 9：changeAppLanguage() 返回简化的结果类型

**选择**：返回 `{ success: boolean }`，调用者无需区分首次加载和缓存

**理由**：
- ✅ **简化接口**：调用者只需关心切换是否成功
- ✅ **隐藏细节**：缓存逻辑对调用者透明
- ✅ **避免歧义**：不需要定义复杂的 `{ success, loaded }` 组合

**代码示例**：
```typescript
async function changeAppLanguage(lang: string): Promise<{ success: boolean }> {
  try {
    // 加载语言（内部会处理缓存）
    await loadLanguage(lang);
    // 切换语言
    await i18n.changeLanguage(lang);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
```

**调用者示例**（Redux middleware）：
```typescript
const result = await changeAppLanguage(newLang);

if (result.success) {
  toast.success('语言切换成功');
} else {
  toast.error(`语言切换失败: ${newLang}`);
}
```

---

## Risks / Trade-offs

### 风险 1：语言切换时的竞态条件（已缓解）

**描述**：用户快速连续切换语言（如：zh → en → fr），可能导致加载顺序混乱

**缓解措施**：
- ✅ 使用 Promise 缓存（决策 1）：`loadingPromises` Map 避免重复请求
- ✅ 加载完成后验证：确保最终语言与用户选择一致
- ✅ 禁用交互：切换期间禁用语言选择器（`disabled={isChanging}`）

---

### 风险 2：系统语言加载失败（已缓解）

**描述**：用户首次启动时，网络不可用或超时，导致系统语言资源加载失败

**缓解措施**：
- ✅ **英文兜底**：英文资源同步打包，即使网络故障也可用
- ✅ **自动重试**：最多重试 2 次，指数退避
- ✅ **Toast 警告**：用户知情问题，但不影响使用
- ✅ **长期缓存**：浏览器缓存机制，第二次启动无需重新下载

**相比原方案的改进**：
- **原方案**：如果英文和系统语言都加载失败，应用无法启动
- **新方案**：英文资源始终可用，系统语言加载失败降级到英文

---

### 风险 3：i18next API 变更导致兼容性问题

**描述**：未来 i18next 版本可能修改 `addResourceBundle()` API 签名

**缓解措施**：
- ✅ 锁定版本：在 `package.json` 中使用精确版本号（如 `^25.7.2`）
- ✅ 单元测试覆盖：测试所有 i18next API 调用，确保升级前发现问题
- ✅ 版本升级指南：在 AGENTS.md 中记录升级注意事项

---

### 风险 4：内存泄漏风险（语言缓存未清理）

**描述**：应用长时间运行，语言缓存可能占用内存

**缓解措施**：
- ✅ 缓存大小可控：最多 3 种语言 × 5 KB = 15 KB，影响可忽略
- ✅ 应用生命周期：缓存在应用关闭后自动释放
- ✅ 未来优化：如需支持更多语言，可实现 LRU 缓存淘汰策略

---

### 权衡 1：开发复杂度 vs 性能收益

**权衡**：
- **开发成本**：约 100-150 行新代码 + 测试
- **性能收益**：节省 33%-67% 初始加载量 + 50-100 ms 启动时间

**结论**：✅ 值得投入
- 收益随语言增长而放大（支持 10 种语言时，节省 45 KB）
- 一次性成本，长期受益

---

### 权衡 2：命名空间级按需加载 vs 语言级按需加载

**权衡**：
- **命名空间级**：节省 2.4 KB（48%），但实现复杂度极高
- **语言级**：节省 5-10 KB（33%-67%），实现简单直接

**结论**：✅ 选择语言级
- 性价比更高（复杂度低，收益明显）
- 用户体验提升显著（2.4 KB vs 5 KB 在网络层面差异不大）

---

## Migration Plan

### 部署步骤

#### 阶段 1：核心功能实现（不影响现有功能）
1. **改造 `src/lib/i18n.ts`**
   - 新增英文资源静态导入（决策 0）
   - 新增 `loadingPromises` Map 和 `loadedLanguages` Set（决策 1）
   - 实现 `loadLanguage()` 函数（决策 5 + 决策 8）
   - 改造 `initI18n()` 去参数化（决策 3 + 决策 4）
   - 改造 `changeAppLanguage()` 返回简化类型（决策 9）
2. **调整 `src/config/initSteps.ts`**
   - i18n 步骤不再需要传入系统语言参数

#### 阶段 2：UI 增强
3. **增强 `src/store/middleware/appConfigMiddleware.ts`**
   - 添加 Toast 加载提示（决策 7）
   - 处理加载失败场景
4. **改造 `src/pages/Setting/.../LanguageSetting.tsx`**
   - 添加 loading 状态
   - 切换期间禁用交互

#### 阶段 3：测试覆盖
5. **更新 `src/__test__/lib/i18n.test.ts`**
   - 添加 `loadLanguage()` 单元测试
   - 更新 `initI18n()` 和 `changeAppLanguage()` 测试
6. **新增 `src/__test__/lib/initialization.test.ts`**
   - 测试完整初始化流程
   - 测试错误降级场景
7. **更新 `src/__test__/store/middleware/appConfigMiddleware.test.ts`**
   - 测试 Toast 提示逻辑
   - 测试错误处理

#### 阶段 4：验证和优化
8. **性能测试**
   - 测量加载前后的文件大小差异
   - 测量启动时间缩短
9. **边界测试**
   - 模拟网络异常
   - 测试快速切换语言（验证决策 1 的效果）
   - 测试不支持的语言

---

### 回滚策略

**触发条件**：
- 发现严重 bug（如应用无法启动）
- 性能指标未达标（启动时间反而增加）

**回滚步骤**：
1. **代码回滚**：
   ```bash
   git revert <commit-hash>
   ```
2. **验证回滚**：
   - 运行单元测试：`pnpm test`
   - 运行集成测试：`pnpm test:integration`
   - 手动验证语言切换功能
3. **通知用户**：
   - 如果已发布到生产环境，发布回滚公告
   - 说明回滚原因和修复计划

**回滚风险**：✅ 低
- 变更集中在 `src/lib/i18n.ts`，回滚影响范围清晰
- 不涉及数据模型或外部 API 变更

---

## Open Questions

### 问题 1：Toast 库的降级方案实现细节

**问题**：如果 Toast 库同步导入失败（如网络完全断开），如何确保应用不崩溃？

**待讨论**：
- 是否需要在 `i18n.ts` 中实现 Toast 降级逻辑？
- 还是依赖 Redux middleware 的错误处理？

**建议**：在 Redux middleware 中实现 Toast 降级，`i18n.ts` 仅抛出错误

---

### 问题 2：快速切换语言的 UX 细节

**问题**：用户快速切换 zh → en → fr → zh，最终显示哪个语言？

**当前设计**：
- 如果 zh 正在加载，用户切换到 en，立即显示 en（已缓存）
- 如果用户切换到 fr，开始加载 fr
- 如果用户切换回 zh，等待 zh 加载完成，显示 zh

**待确认**：是否符合用户预期？

---

## Appendix: 决策对比原方案的变化

### 变更 1：决策编号重构
- **原方案**：决策编号混乱（0, 1, 2, 3, 4, 4b, 5, 9, 6, 5(保留), 3(修正)）
- **新方案**：重新编号为连续序列（0-9），删除重复内容

### 变更 2：initI18n() 去参数化
- **原方案**：`initI18n(systemLang?: string)` 接受可选参数（方案 B）
- **新方案**：`initI18n()` 不接受参数，内部检测系统语言（决策 3）
- **理由**：避免单例模式与参数化初始化的语义矛盾

### 变更 3：使用 Map 缓存 Promise
- **原方案**：仅使用 `Set<string>` 标记已加载语言
- **新方案**：使用 `Map<string, Promise<void>>` 缓存进行中的请求（决策 1）
- **理由**：避免快速切换时的竞态条件

### 变更 4：changeAppLanguage() 返回类型简化
- **原方案**：返回 `{ success: boolean, loaded: boolean }`
- **新方案**：返回 `{ success: boolean }`（决策 9）
- **理由**：简化接口，避免复杂的组合状态
