# Design: 国际化错误消息

## Context

### 当前状态

应用在两个关键位置存在硬编码的错误消息：

1. **appConfigSlices.ts**：三个 Redux thunk 的错误处理中包含硬编码的英文错误消息
   - `initializeAppLanguage`: "Fail to initialize language"
   - `initializeTransmitHistoryReasoning`: "Fail to initialize transmitHistoryReasoning"
   - `initializeAutoNamingEnabled`: "Fail to initialize autoNamingEnabled"

2. **initSteps.ts**：应用初始化步骤的错误处理中包含硬编码的中文错误消息
   - i18n、masterKey、models、chatList、appLanguage 等步骤

### 约束条件

- **初始化顺序**：i18n 是第一步初始化，因此 i18n 初始化失败时无法使用翻译系统
- **性能要求**：error 命名空间需要立即可用，不能异步加载
- **架构一致性**：必须遵循现有的国际化架构（i18next + react-i18next）
- **代码风格**：非React环境无法使用 `useTranslation` hook

### 利益相关者

- 终端用户：需要看到本地化的错误消息
- 开发者：需要简单、安全的 API 来获取翻译
- 国际化系统：需要与现有的按需加载机制协调

## Goals / Non-Goals

### Goals

- **完整的国际化支持**：所有用户可见的错误消息都支持 en/zh/fr 三种语言
- **安全的翻译获取**：提供在非React环境中获取翻译的可靠机制
- **优雅降级**：在 i18n 未就绪时提供有意义的错误消息
- **架构一致性**：遵循项目现有的国际化模式和约定
- **零破坏性变更**：不改变任何公共 API 或影响现有功能

### Non-Goals

- **不修改 React 组件**：组件中的国际化已通过 `useTranslation` hook 实现
- **不改变按需加载策略**：error.json 之外的语言资源仍然按需加载
- **不重构整个错误处理系统**：仅针对已识别的硬编码错误消息
- **不提供动态错误消息**：不处理需要运行时参数的复杂错误消息

## Decisions

### 1. error.json 加载策略：英文静态打包 + 其他语言动态加载

**决策**：
- **英文** error.json 纳入"第一公民"策略，与 common.json 等文件一起静态打包到初始 bundle
- **中文和法文** error.json 采用动态按需加载，通过 `import.meta.glob` 在运行时加载
- 翻译完整性通过 `npm run lint:i18n` 脚本验证，确保文件存在和键值结构一致
- **不使用构建时导入验证**：避免 `import zhError from "../locales/zh/error.json"` + `void { zh: zhError }` 的冗余验证

**理由**：
- **英文静态打包**：初始化错误发生在应用启动的最早期，必须立即可用
- **其他语言动态加载**：与现有架构一致（其他命名空间都是动态加载），减少初始 bundle 大小
- **英文降级策略**：即使动态加载失败，用户也能看到有意义的英文错误消息
- **CI/CD 验证**：`lint:i18n` 确保翻译文件存在性，无需构建时导入验证
- **代码简洁性**：避免不必要的导入和 `void` 表达式，代码意图更明确

**替代方案**：
- **方案 A**：三语言全部静态打包
  - ❌ 被拒绝：增加约 1KB 初始 bundle，中文和法文用户占比较小
- **方案 B**：将错误消息合并到 existing common.json
  - ❌ 被拒绝：error 消息有特殊的语义和使用场景，独立命名空间更清晰
- **方案 C**：全部动态加载
  - ❌ 被拒绝：初始化时 i18n 可能未就绪，异步加载会导致错误消息显示为键值
- **方案 D**：使用构建时导入验证
  - ❌ 被拒绝：与动态加载架构不一致，增加代码复杂度，lint:i18n 已提供完整验证

**实现**：
```typescript
// src/lib/i18n.ts
import enError from "../locales/en/error.json";
// zh 和 fr 的 error.json 通过 import.meta.glob 动态加载
// 翻译完整性通过 npm run lint:i18n 验证

const EN_RESOURCES = {
  // ...existing namespaces
  error: enError,
};
```

**验证机制对比**：

| 验证方式 | 构建时导入 | lint:i18n 脚本（当前方案） |
|---------|-----------|------------------------|
| 验证时机 | 构建时 | CI/CD 和预提交钩子 |
| 代码侵入性 | 需要 `void` 表达式 | 无需额外代码 |
| 架构一致性 | 与动态加载矛盾 | 与现有架构一致 |
| 验证范围 | 文件存在性 | 文件存在性 + 键值结构完整性 |
| 失败反馈 | 立即失败 | CI/CD 阻止合并 |

### 2. tSafely() 安全翻译函数

**决策**：在 `src/lib/i18n.ts` 中导出 `tSafely()` 函数，用于非React环境的安全翻译获取。

**理由**：
- Redux thunks、初始化代码等无法使用 React hooks
- 需要处理 i18n 未初始化、翻译键不存在、翻译过程出错等边界情况
- 提供统一的降级策略，简化调用方的错误处理

**API 设计**：
```typescript
/**
 * 安全地获取翻译文本（用于非 React 环境）
 * 
 * 特性：
 * - 处理 i18n 未初始化的情况
 * - 翻译不存在时使用降级文本
 * - 支持嵌套键值（如 'error.initialization.i18nFailed'）
 * - 参数验证：防御 null/undefined
 * - 类型安全：确保始终返回字符串
 * 
 * @param key 翻译键（支持点号分隔的嵌套键，如 'error.initialization.i18nFailed'）
 * @param fallback 降级文本（i18n 未就绪或翻译不存在时使用，至少返回空字符串）
 * @returns 翻译后的文本，始终返回非空字符串
 */
export const tSafely = (key: string, fallback: string): string => {
  // 参数验证：防御 null/undefined
  const safeKey = key ?? '';
  const safeFallback = (fallback ?? '') || '';  // 确保至少返回空字符串

  if (i18n.isInitialized && safeKey) {
    try {
      const translated = i18n.t(safeKey);
      // 翻译不存在、等于键本身、或非字符串类型时使用降级
      if (typeof translated !== 'string' || translated === safeKey || !translated) {
        return safeFallback;
      }
      return translated;
    } catch (error) {
      // 记录异常但不中断流程
      console.warn('[tSafely] Translation failed for key:', safeKey, error);
      return safeFallback;
    }
  }

  return safeFallback;
};

// TypeScript 类型导出（供其他模块导入）
export type SafeTranslator = typeof tSafely;
```

**使用示例**：
```typescript
// 在 Redux thunk 中
throw new Error(
  tSafely(
    'error.appConfig.failToInitializeLanguage',
    'Failed to initialize language'
  ),
  { cause: error }
);
```

**替代方案**：
- **方案 A**：在 Redux store 中保存 t 函数的引用
  - ❌ 被拒绝：增加 Redux 和 i18n 的耦合度，违反单向数据流原则
- **方案 B**：使用回调函数传递 t 函数
  - ❌ 被拒绝：增加函数签名复杂度，调用方需要额外处理

### 3. 英文降级策略

**决策**：当 i18n 未就绪或翻译不存在时，使用英文作为降级语言。

**理由**：
- 英文是应用的默认语言和 fallbackLng
- 简洁可靠，无需额外的语言检测逻辑
- 技术用户和开发者通常能够理解英文错误消息

**考虑过的替代方案**：
- **方案 A**：使用系统语言降级
  - ❌ 被拒绝：增加复杂度，且系统语言翻译可能不存在
- **方案 B**：使用翻译键（如 'error.initialization.i18nFailed'）
  - ❌ 被拒绝：对用户不友好，无法传达有用的错误信息

### 4. i18n 初始化错误的特殊处理

**决策**：在 initSteps.ts 中，i18n 初始化步骤的错误消息使用英文常量，不调用 `tSafely()`。

**理由**：
- i18n 是第一步初始化，此时 i18n 肯定未就绪
- 避免潜在的无限循环或未定义行为
- i18n 初始化失败是极其罕见的边缘情况

**实现**：
```typescript
// src/config/initSteps.ts
const I18N_INIT_FAILED = 'Failed to initialize internationalization';

export const initSteps: InitStep[] = [
  {
    name: 'i18n',
    critical: true,
    execute: async () => {
      await initI18n();
    },
    onError: (error) => ({
      severity: 'fatal',
      message: I18N_INIT_FAILED,  // 使用常量，不调用 tSafely()
      originalError: error,
    }),
  },
  // ...其他步骤可以使用 tSafely()
];
```

### 5. 翻译键值组织结构

**决策**：error.json 中使用两级嵌套结构：`error.{category}.{specificError}`。

**示例**：
```json
{
  "initialization": {
    "i18nFailed": "Failed to initialize internationalization",
    "masterKeyFailed": "Failed to initialize master key",
    "appLanguageFailed": "Failed to load application language configuration"
  },
  "appConfig": {
    "failToInitializeLanguage": "Failed to initialize language",
    "failToInitializeTransmitHistoryReasoning": "Failed to initialize transmit history reasoning"
  }
}
```

**理由**：
- 按照错误来源（initialization, appConfig）分组，便于维护
- 两级嵌套既清晰又不过度复杂
- 与现有命名空间（如 autoNaming.title）保持一致的深度

## Risks / Trade-offs

### Risk 1: Bundle 大小增加

**风险**：error.json 静态打包会增加初始 bundle 大小（仅英文）。

**实际影响**：826 字节（包含 11 个错误消息键值），对首次加载时间的影响微乎其微（< 1% 总 bundle 大小）。

**缓解措施**：
- error.json 内容精简，仅包含必要的错误消息
- 使用压缩和 gzip 进一步减少传输大小（gzip 后约 300-400 字节）
- 中文和法文采用动态加载，不影响初始 bundle
- 收益（完整的国际化支持）远大于成本（微小的性能影响）

### Risk 2: 翻译键值可能不同步

**风险**：在添加新的错误消息时，可能遗漏某个语言的翻译。

**影响**：导致该语言用户看到降级文本（英文）或翻译键。

**缓解措施**：
- 使用现有的 `npm run lint:i18n` 脚本自动检查翻译完整性
- 在 CI/CD 中集成翻译完整性检查（`npm run validate`）
- 代码审查时确保所有三语言的翻译都存在
- 英文降级策略确保即使翻译缺失也能显示有意义的错误消息

### 翻译完整性验证机制

项目采用 **`npm run lint:i18n`** 脚本验证翻译文件完整性，确保：

1. **文件存在性**：所有语言的 error.json 文件都存在
2. **键值结构一致性**：以英文为基准，验证中文和法文具有相同的键值结构
3. **CI/CD 集成**：通过 `npm run validate` 在每次提交前自动运行
4. **早期失败**：相比运行时发现缺失，CI/CD 能在代码审查阶段就捕获问题

这种机制相比构建时导入验证的优势：
- **代码更简洁**：无需冗余的 `void { zh: zhError, fr: frError }` 表达式
- **架构一致性**：中文和法文的其他命名空间都是动态加载，error.json 不应例外
- **明确的意图**：lint 脚本专门用于验证翻译，而静态导入的主要目的是打包资源

### Risk 3: 降级消息始终为英文

**风险**：非英文用户在极少数情况下（i18n 未就绪或翻译缺失）会看到英文错误消息。

**影响**：用户体验略有下降，但错误消息仍然可读（英文是技术通用语言）。

**缓解措施**：
- 这种情况仅发生在初始化失败等边缘场景
- 应用正常运行后，所有错误消息都会正确本地化
- 降级消息使用简洁的英文，易于理解

### Risk 4: tSafely() 性能开销

**风险**：每次调用 `tSafely()` 都会检查 `i18n.isInitialized`，可能带来轻微性能开销。

**影响**：错误是异常情况，频率极低，性能开销可忽略不计。

**缓解措施**：
- 错误处理路径的性能要求远低于正常业务逻辑
- `i18n.isInitialized` 检查是简单的布尔值读取，开销极小

## Migration Plan

### 阶段 1：准备工作

1. **创建 error.json 文件**
   - 创建 `src/locales/en/error.json`
   - 创建 `src/locales/zh/error.json`
   - 创建 `src/locales/fr/error.json`
   - 包含所有初始化和配置相关的错误消息翻译

2. **增强 i18n.ts**
    - 导入英文 error 命名空间并静态打包到 EN_RESOURCES
    - 实现 `tSafely()` 函数，支持英文降级策略
    - 导出 `tSafely` 供其他模块使用
    - 依赖 `npm run lint:i18n` 验证翻译完整性

### 阶段 2：代码重构

3. **重构 appConfigSlices.ts**
   - 替换 `initializeAppLanguage` 中的错误消息
   - 替换 `initializeTransmitHistoryReasoning` 中的错误消息
   - 替换 `initializeAutoNamingEnabled` 中的错误消息

4. **重构 initSteps.ts**
   - 为 i18n 初始化错误定义英文常量
   - 替换其他步骤的错误消息为 `tSafely()` 调用

### 阶段 3：验证

5. **运行翻译完整性检查**
   ```bash
   npm run lint:i18n
   ```
   - 确保所有三语言的翻译键值完整
   - 修复任何遗漏的翻译

6. **手动测试**
   - 模拟各种初始化失败场景
   - 验证不同语言环境下的错误消息显示
   - 确认降级策略正常工作

### 回滚策略

- 所有修改都在 src/ 目录下，不涉及配置文件或数据库
- 如出现问题，可以通过 git revert 快速回滚
- 修改是增量式的，可以分步验证和回滚

## Open Questions

**当前无未解决的问题**。所有技术决策都已明确，实施路径清晰。
