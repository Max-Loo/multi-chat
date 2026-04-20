# 国际化系统

本文档说明应用的国际化（i18n）系统，包括按需加载、缓存验证、Toast 队列、自动持久化和翻译完整性检查。

## 动机

应用支持多种语言（中文、英文、法文），需要：
- **性能优化**：减少初始加载时间
- **用户体验**：自动检测系统语言
- **数据一致性**：确保翻译文件完整性
- **优雅降级**：加载失败时提供备选方案

## 架构概览

```
语言检测
    ↓
按需加载 (英文静态打包，其他异步加载)
    ↓
Toast 队列 (初始化期间提示)
    ↓
自动持久化 (Redux Middleware → localStorage)
    ↓
翻译完整性检查 (CI 集成)
```

## 1. 按需加载机制

### 策略

**英文资源**（"第一公民"策略）：
- 静态打包到初始 bundle（~7KB，包含 error 命名空间）
- 作为默认语言和降级选项
- 包括：common, chat, model, navigation, provider, setting, table, **error**

**其他语言**：
- 按需异步加载
- 使用 Vite 的 `import.meta.glob` 动态导入
- 加载后缓存内存

### 性能优化

| 系统语言 | 初始加载节省 |
|---------|-------------|
| 英文     | 67%         |
| 其他语言 | 33%         |

### 降级策略

```
1. 尝试加载系统语言
   ├─ 成功 → 使用系统语言
   └─ 失败 → 继续下一步
2. 自动降级到英文
   └─ 显示 Toast 提示："系统语言加载失败，已使用英文替代"
```

### 实现位置

**位置**：`src/services/i18n.ts`

**核心函数**：
- `initI18n()`: 初始化 i18n 配置
- `changeAppLanguage(lang)`: 切换应用语言
- `getInitI18nPromise()`: 获取初始化 Promise
- `tSafely(key, fallback)`: 安全地获取翻译文本（用于非 React 环境）

**关键特性**：
- 单例模式（避免重复初始化）
- 并发控制（避免重复加载）
- 指数退避重试（1s → 2s）
- 资源缓存（Set + Map）
- **error 命名空间**：静态打包，初始化阶段的错误消息立即可用

## 2. 缓存验证和迁移

### 四级降级策略

```
1. 缓存语言
   ├─ 有效 → 直接使用
   ├─ 无效且有迁移规则 → 继续下一步
   └─ 无效且无迁移规则 → 继续下一步

2. 迁移语言
   ├─ 迁移目标有效 → 使用迁移语言，显示 Toast："检测到语言代码已更新为..."
   └─ 迁移目标无效 → 继续下一步

3. 系统语言
   ├─ 在支持列表中 → 使用系统语言，显示 Toast："已切换到系统语言：..."
   └─ 不在支持列表中 → 继续下一步

4. 默认语言（英文）
   └─ 显示 Toast："语言代码已失效，已切换到英文"
```

### 性能优化

使用 `Set.has()` 替代 `Array.includes()`：
- 时间复杂度：O(n) → O(1)
- 适用于频繁的语言代码查询

### 语言代码迁移

**迁移映射表**：
```typescript
LANGUAGE_MIGRATION_MAP = {
  "zh-CN": "zh",  // 旧代码 → 新代码
}
```

### 实现位置

**位置**：`src/services/global.ts`, `src/utils/constants.ts`

**核心函数**：
- `getDefaultAppLanguage()`: 获取默认应用语言
- `getLanguageLabel(lang)`: 获取语言显示标签

**类型定义**：
```typescript
interface LanguageResult {
  lang: string;              // 最终使用的语言代码
  migrated: boolean;         // 是否执行了迁移
  from?: string;             // 迁移前的语言代码
  fallbackReason?: 'cache-invalid' | 'system-lang' | 'default';
}
```

## 3. Toast 队列

### 问题

初始化期间，Toaster 组件尚未挂载，导致语言切换提示静默失败。

### 解决方案

使用消息队列管理 Toast 提示：
- 初始化期间将消息加入队列
- Toaster 组件挂载后批量显示
- 消息间隔 500ms，避免重叠

### 实现位置

**位置**：`src/services/toast/toastQueue.ts`, `src/main.tsx`

**核心 API**：
```typescript
// 加入队列
toastQueue.enqueue({
  type: 'info',
  message: '已切换到系统语言：中文'
});

// 标记就绪（Toaster 组件挂载时）
toastQueue.markReady();
```

**消息类型**：
- `info`: 信息提示
- `success`: 成功提示
- `warning`: 警告提示
- `error`: 错误提示

## 4. 自动持久化

### Redux Middleware

监听语言变更 actions，自动同步到 localStorage：

```typescript
// 方案 1：使用 Listener Middleware（推荐）
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

saveDefaultAppLanguage.startListening({
  matcher: isAnyOf(
    setAppLanguage,                      // 用户主动切换语言
    initializeAppLanguage.fulfilled,     // 初始化时语言降级
  ),
  effect: async (action, listenerApi) => {
    // 根据 action 类型选择数据源，确保持久化的值准确可靠
    // - initializeAppLanguage.fulfilled: 使用 action.payload（直接来自 thunk 返回值，更可靠）
    // - setAppLanguage: 使用 store 中的值（可能有其他中间件或 reducer 修改）
    const langToPersist = action.type.endsWith('/fulfilled')
      ? (action.payload as string)
      : listenerApi.getState().appConfig.language;

    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, langToPersist);

    // 只在用户主动切换时显示 Toast（初始化降级不显示）
    if (action.type === 'appConfig/setAppLanguage') {
      // 显示 Toast 提示...
    }
  },
});

// 方案 2：使用普通 Middleware
export const createLanguagePersistenceMiddleware = (): Middleware => {
  return (_store) => (next) => (action: any) => {
    const result = next(action);

    if (action.type.endsWith('/setAppLanguage')) {
      try {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, action.payload);
      } catch (error) {
        console.warn('[LanguagePersistence] 持久化失败:', error);
      }
    }

    return result;
  };
};
```

### 两个 Actions 的区别

| Action Type | 触发时机 | 是否显示 Toast | 使用场景 |
|------------|---------|---------------|----------|
| `initializeAppLanguage.fulfilled` | 应用初始化时 | ❌ 否 | 语言降级、缓存迁移 |
| `setAppLanguage` | 用户主动切换 | ✅ 是 | 用户在设置中切换语言 |

### 静默降级

写入失败时不抛出错误，确保应用继续运行。

### 实现位置

**位置**：
- **middleware**：`src/store/middleware/appConfigMiddleware.ts`

## 5. 翻译完整性检查

### 自动化工具

使用 Node.js 脚本验证翻译文件的完整性：
- 以英文为基准语言
- 比较其他语言的键值结构
- 支持嵌套键值的递归比较
- 生成详细的差异报告

### 使用方法

```bash
# 检查翻译完整性
npm run lint:i18n

# 显示详细信息
npm run lint:i18n -- --verbose

# 运行完整验证（包括 lint 和 i18n）
npm run validate
```

### 退出码

- `0`: 所有翻译完整，无缺失
- `1`: 发现缺失的翻译键值
- `2`: 文件读取错误或其他问题

### 核心功能

1. **自动检测**：以英文为基准语言，比较其他语言的翻译文件
2. **深度检查**：支持嵌套键值的递归比较（如 `autoNaming.title`）
3. **清晰报告**：生成详细的差异报告，指出缺失的键值和位置
4. **集成验证**：通过 npm scripts 集成到开发工作流

### 实现位置

- **检查工具**：`scripts/check-i18n.js`
- **集成点**：`package.json` - `lint:i18n` 和 `validate` scripts
- **文档**：`scripts/README.md` - 工具使用说明

## 支持的语言

| 语言代码 | 语言名称 | Flag |
|---------|---------|------|
| `zh`    | 中文    | 🇨🇳   |
| `en`    | English | 🇺🇸   |
| `fr`    | Français| 🇫🇷   |

## 实现位置

- **按需加载**：`src/services/i18n.ts`
- **安全翻译函数**：`src/services/i18n.ts` - `tSafely()`
- **缓存验证**：`src/services/global.ts`, `src/utils/constants.ts`
- **Toast 队列**：`src/services/toast/toastQueue.ts`
- **自动持久化**：`src/store/middleware/appConfigMiddleware.ts`
- **翻译完整性检查**：`scripts/check-i18n.js`
- **翻译文件**：`src/locales/{lang}/`
- **error 命名空间**：`src/locales/{lang}/error.json`

## 使用示例

### 安全翻译函数（tSafely）

用于非 React 环境（如 Redux thunks、初始化代码）：

```typescript
import { tSafely } from '@/services/i18n';

// 在 Redux thunk 中使用
throw new Error(
  tSafely(
    'error.appConfig.failToInitializeLanguage',
    'Failed to initialize language'
  ),
  { cause: error }
);

// 在初始化步骤中使用
onError: (error) => ({
  severity: 'fatal',
  message: tSafely('error.initialization.masterKeyFailed', 'Failed to initialize master key'),
  originalError: error,
})
```

**tSafely 特性**：
- 处理 i18n 未初始化的情况（返回降级文本）
- 翻译不存在时使用降级文本
- 支持嵌套键值（如 'error.initialization.i18nFailed'）
- 参数验证：防御 null/undefined
- 类型安全：确保始终返回字符串

### 切换语言

```typescript
import { changeAppLanguage } from '@/services/i18n';

// 切换到中文
const { success } = await changeAppLanguage('zh');

if (!success) {
  console.error('语言切换失败');
}
```

### 使用 Toast 队列

```typescript
import { toastQueue } from '@/services/toast/toastQueue';

// 在初始化期间使用
toastQueue.enqueue({
  type: 'info',
  message: '应用已准备就绪'
});

// Toaster 组件挂载时标记就绪
useEffect(() => {
  toastQueue.markReady();
}, []);
```

### 添加新的翻译

```typescript
// 1. 在 src/locales/en/ 下添加英文翻译
// src/locales/en/common.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}

// 2. 在其他语言下添加对应翻译
// src/locales/zh/common.json
{
  "newFeature": {
    "title": "新功能",
    "description": "这是一个新功能"
  }
}

// 3. 运行翻译完整性检查
npm run lint:i18n
```

## 注意事项

1. **语言文件结构**：所有语言必须具有相同的键值结构
2. **嵌套键值**：使用点号表示嵌套（如 `autoNaming.title`）
3. **降级策略**：所有语言加载失败时都会降级到英文
4. **缓存清理**：修改 `LANGUAGE_MIGRATION_MAP` 后需清理缓存
5. **Toast 时序**：初始化期间必须使用 toastQueue，不能直接调用 toast()
6. **错误消息国际化**：
   - 初始化错误使用 `tSafely()` 函数（i18n 初始化错误除外，使用英文常量）
   - error 命名空间静态打包，立即可用
   - 所有用户可见的错误消息都应支持多语言

## 性能优化

1. **按需加载**：减少初始 bundle 大小 33-67%
2. **Set 优化**：语言代码查询性能提升（O(n) → O(1)）
3. **缓存机制**：避免重复加载语言资源
4. **指数退避**：减少网络请求压力
5. **批量处理**：Toast 消息批量显示，避免 UI 抖动
6. **error 命名空间**：静态打包增加约 1-2KB，对性能影响可忽略不计

## error 命名空间

### 用途

专门用于错误消息的国际化翻译，包括：
- 初始化错误（i18n、masterKey、models 等）
- 应用配置错误（语言、推理内容传输、自动命名等）

### 结构

```json
{
  "initialization": {
    "i18nFailed": "Failed to initialize internationalization",
    "masterKeyFailed": "Failed to initialize master key",
    "modelsFailed": "Failed to load model data",
    ...
  },
  "appConfig": {
    "failToInitializeLanguage": "Failed to initialize language",
    "failToInitializeTransmitHistoryReasoning": "Failed to initialize transmit history reasoning",
    "failToInitializeAutoNamingEnabled": "Failed to initialize auto naming"
  }
}
```

### 特性

- **静态打包**：纳入"第一公民"策略，立即可用
- **完整翻译**：支持 en/zh/fr 三种语言
- **类型安全**：通过构建验证确保所有语言的键值结构一致
