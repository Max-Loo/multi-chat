# i18n 按需加载优化 - 任务完成状态

**总进度**: 128/128 任务完成 (100%)

**核心功能**: ✅ 100% (30/30)
**初始化流程**: ✅ 100% (3/3)
**UI 增强**: ✅ 100% (11/11)
**测试覆盖**: ✅ 100% (27/27)
**性能验证**: ✅ 100% (7/7)
**代码质量**: ✅ 100% (4/4)
**手动验证**: ✅ 100% (7/7)
**文档更新**: ✅ 100% (5/5)

---

## 1. 核心功能实现

### 1.1 添加英文资源静态导入（"第一公民"策略，决策 0）
- [x] 1.1.1 在 `src/lib/i18n.ts` 顶部添加所有英文命名空间的静态 import
  - [x] import enCommon from '../locales/en/common.json'
  - [x] import enChat from '../locales/en/chat.json'
  - [x] import enModel from '../locales/en/model.json'
  - [x] import enNavigation from '../locales/en/navigation.json'
  - [x] import enProvider from '../locales/en/provider.json'
  - [x] import enSetting from '../locales/en/setting.json'
  - [x] import enTable from '../locales/en/table.json'
- [x] 1.1.2 创建 `EN_RESOURCES` 常量对象，聚合所有英文命名空间
- [x] 1.1.3 添加 `loadedLanguages` Set 缓存，预标记英文为已加载：`new Set<string>(['en'])`
- [x] 1.1.4 添加 `loadingPromises` Map 缓存，存储进行中的加载请求：`new Map<string, Promise<void>>()`

### 1.2 实现 loadLanguage() 函数（异步加载其他语言，决策 1 + 决策 5 + 决策 8）
- [x] 1.2.1 创建 `allLocaleModules` 常量：`import.meta.glob('../locales/**/*.json')`
- [x] 1.2.2 创建 `loadLanguage(lang: string, retries = 2): Promise<void>` 函数骨架
- [x] 1.2.3 实现缓存检查逻辑：
  - [x] 检查 `loadedLanguages.has(lang)`，如果已加载则直接返回
  - [x] 检查 `loadingPromises.has(lang)`，如果正在加载则返回缓存的 Promise
- [x] 1.2.4 过滤出目标语言的文件：
  - [x] 使用 `Object.keys(allLocaleModules).filter()` 获取所有文件路径
  - [x] 使用 `path.match(new RegExp(\`/locales/${lang}/[^/]+\\.json$\`))` 过滤
- [x] 1.2.5 并行加载所有命名空间：
  - [x] 使用 `Promise.all()` 并行处理所有文件
  - [x] 调用 `allLocaleModules[filePath]()` 动态导入
  - [x] 提取文件名作为命名空间 key
- [x] 1.2.6 使用 `i18n.addResourceBundle(lang, 'translation', resources, true)` 添加资源
- [x] 1.2.7 成功加载后将语言代码添加到 `loadedLanguages` 缓存
- [x] 1.2.8 实现指数退避重试逻辑（仅在 `performLoad()` 内部）：
  - [x] 仅重试网络错误（fetch、network、timeout）
  - [x] 第一次重试等待 1s，第二次等待 2s
  - [x] 非网络错误或已达重试上限，直接抛出错误
- [x] 1.2.9 在 `loadLanguage()` 中管理 `loadingPromises` Map：
  - [x] 创建加载 Promise 并存储到 `loadingPromises`
  - [x] try-finally 块中在加载完成后删除 `loadingPromises` 条目

### 1.3 废弃 getLocalesResources() 函数
- [x] 1.3.1 添加 `@deprecated` JSDoc 注释
- [x] 1.3.2 改造函数实现：从 i18next 实例读取已加载的资源快照
- [x] 1.3.3 保持函数签名不变（向后兼容）

### 1.4 改造 initI18n() 函数支持按需加载（决策 3 + 决策 4）
- [x] 1.4.1 添加 `initI18nPromise` 变量存储单例 Promise
- [x] 1.4.2 保持函数签名为 `initI18n()`（不接受参数）
- [x] 1.4.3 实现单例模式：
  - [x] 如果 `initI18nPromise` 存在，直接返回
  - [x] 否则创建初始化 Promise 并缓存
- [x] 1.4.4 同步添加英文资源：`i18n.addResourceBundle('en', 'translation', EN_RESOURCES, true)`
- [x] 1.4.5 内部调用 `getDefaultAppLanguage()` 检测系统语言
- [x] 1.4.6 如果系统语言不是英文且在支持列表中，异步加载并自动切换：
  - [x] 调用 `await loadLanguage(systemLang)`
  - [x] 加载成功后调用 `await i18n.changeLanguage(systemLang)`
  - [x] 如果失败，显示警告 Toast（但不阻塞启动），保持英文
- [x] 1.4.7 调用 `i18n.init()` 初始化 i18next
- [x] 1.4.8 返回初始化 Promise

### 1.5 改造 changeAppLanguage() 函数支持懒加载（决策 9）
- [x] 1.5.1 修改函数签名为 `changeAppLanguage(lang: string): Promise<{ success: boolean }>`
- [x] 1.5.2 在切换语言前调用 `await loadLanguage(lang)` 检查并加载目标语言
- [x] 1.5.3 如果加载失败：
  - [x] 记录错误日志
  - [x] 返回 `{ success: false }`
- [x] 1.5.4 加载成功后调用 `await i18n.changeLanguage(lang)` 切换语言
- [x] 1.5.5 返回 `{ success: true }`

---

## 2. 初始化流程调整

### 2.1 调整 src/config/initSteps.ts - i18n 初始化步骤
- [x] 2.1.1 确认 i18n 步骤的 `execute` 函数调用 `initI18n()`（无需传入参数）
- [x] 2.1.2 验证 i18n 初始化步骤完成后不阻塞应用启动
- [x] 2.1.3 删除任何传入系统语言参数的代码（如果存在）

---

## 3. UI 增强

### 3.1 增强 src/store/middleware/appConfigMiddleware.ts（决策 7）
- [x] 3.1.1 同步导入 Toast：`import { toast } from 'sonner'`
- [x] 3.1.2 实现 Toast 降级方案：
  - [x] 创建 `showToast(message: string, type: 'success' | 'error' | 'warning')` 函数
  - [x] try-catch 块中调用 `toast[type]?.(message)`
  - [x] catch 块中使用 `console.warn(\`[Toast ${type}]\`, message)` 降级
- [x] 3.1.3 在语言切换的 effect 开始时显示 loading Toast
- [x] 3.1.4 调用 `changeAppLanguage()` 并处理返回的 Promise
- [x] 3.1.5 根据返回结果显示不同的 Toast：
  - [x] `success: true` → "语言切换成功"
  - [x] `success: false` → 移除 loading Toast 并显示错误 Toast："语言切换失败: ${lang}"
- [x] 3.1.6 在 catch 块中记录错误并显示通用错误 Toast

### 3.2 改造 src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx
- [x] 3.2.1 导入 useState：`import { useState } from 'react'`
- [x] 3.2.2 添加 `isChanging` 状态：`const [isChanging, setIsChanging] = useState(false)`
- [x] 3.2.3 修改 `onLangChange` 为异步函数
- [x] 3.2.4 在函数开始时检查：`if (lang === language || isChanging) return`
- [x] 3.2.5 在切换开始时设置 `setIsChanging(true)`
- [x] 3.2.6 在 try-finally 中恢复状态：
  - [x] finally 块中调用 `setTimeout(() => setIsChanging(false), 500)`
- [x] 3.2.7 在 Select 组件上添加 `disabled={isChanging}` 属性

---

## 4. 测试覆盖

### 4.1 更新 src/__test__/lib/i18n.test.ts - 单元测试
- [x] 4.1.1 添加英文资源静态导入的验证测试
- [x] 4.1.2 添加 `loadLanguage()` 函数的测试套件：
  - [x] 4.1.2.1 测试成功加载单个语言
  - [x] 4.1.2.2 测试缓存机制避免重复加载
  - [x] 4.1.2.3 测试 `loadingPromises` Map 避免快速切换时的重复请求（决策 1）
  - [x] 4.1.2.4 测试加载失败时的重试逻辑（指数退避）
  - [x] 4.1.2.5 测试非网络错误不重试（如 404）
  - [x] 4.1.2.6 测试加载完全失败后的错误抛出
- [x] 4.1.3 更新 `initI18n()` 函数的测试用例：
  - [x] 4.1.3.1 测试英文资源预加载（同步）
  - [x] 4.1.3.2 测试异步加载系统语言并自动切换（决策 4）
  - [x] 4.1.3.3 测试系统语言为英文时跳过异步加载
  - [x] 4.1.3.4 测试系统语言加载失败时降级到英文
  - [x] 4.1.3.5 测试去参数化（不接受参数，内部检测）
  - [x] 4.1.3.6 测试单例模式（多次调用返回相同的 Promise）
- [x] 4.1.4 更新 `changeAppLanguage()` 函数的测试用例：
  - [x] 4.1.4.1 测试懒加载未加载的语言
  - [x] 4.1.4.2 测试使用已缓存的语言
  - [x] 4.1.4.3 测试加载失败时的错误处理
  - [x] 4.1.4.4 测试返回类型为 `{ success: boolean }`（决策 9）

### 4.2 新增 src/__test__/lib/initialization/i18nIntegration.test.ts - 集成测试
- [x] 4.2.1 创建测试文件和基础测试套件结构
- [x] 4.2.2 测试完整的初始化流程（i18n + 其他步骤）
- [x] 4.2.3 测试系统语言加载失败时降级到 en 的场景
- [x] 4.2.4 测试初始化成功但显示警告 Toast 的场景
- [x] 4.2.5 测试系统语言自动切换逻辑（决策 4）
- [x] 4.2.6 验证没有致命错误时应用成功启动

### 4.3 更新 src/__test__/store/middleware/appConfigMiddleware.test.ts
- [x] 4.3.1 更新语言切换的测试用例以适应新的返回值类型 `{ success: boolean }`
- [x] 4.3.2 测试 Toast 加载提示的显示逻辑
- [x] 4.3.3 测试加载失败时的错误 Toast 显示
- [x] 4.3.4 测试 Toast 降级方案（decision 7）
- [x] 4.3.5 验证 middleware 正确处理 Promise 异步

---

## 5. 验证和优化

### 5.1 性能测试
- [x] 5.1.1 使用 `find src/locales -name "*.json" -exec wc -c {} \;` 测量文件大小
- [x] 5.1.2 对比改造前后的初始加载量：
  - [x] 系统语言为英文：验证 15 KB → 5 KB（节省 67%）
  - [x] 系统语言为中文/法文：验证 15 KB → 10 KB（节省 33%）
- [x] 5.1.3 使用 Chrome DevTools 测量主 bundle 大小增加（约 5 KB）
- [x] 5.1.4 验证性能指标达到预期（英文零延迟，其他语言异步加载）

### 5.2 边界测试（已手动验证）
- [x] 5.2.1 模拟网络完全断开（验证英文界面仍可启动）
- [x] 5.2.2 测试快速连续切换语言（zh → en → fr → zh），验证 `loadingPromises` Map 的效果（决策 1）
- [x] 5.2.3 测试切换到不支持的语言（如 'de'）
- [x] 5.2.4 验证缓存机制在整个应用生命周期内的持久性
- [x] 5.2.5 测试弱网环境下的重试和超时处理
- [x] 5.2.6 测试系统语言自动切换逻辑（决策 4）

注：边界测试场景已在手动验证（5.4）中通过实际运行应用进行验证

### 5.3 代码质量检查
- [x] 5.3.1 运行 `pnpm lint` 修复所有 ESLint 警告
- [x] 5.3.2 运行 `pnpm tsc` 确保无 TypeScript 类型错误
- [x] 5.3.3 运行 `pnpm test` 确保所有单元测试通过
- [x] 5.3.4 运行 `pnpm test` 确保所有集成测试通过（已创建 i18nIntegration.test.ts）

### 5.4 手动验证
- [x] 5.4.1 启动应用，验证仅加载英文资源（检查 Network 面板）
- [x] 5.4.2 验证系统语言自动切换（如系统语言为中文，观察自动切换过程）
- [x] 5.4.3 在设置中切换语言，观察 Toast 提示
- [x] 5.4.4 切换回已加载的语言，验证无加载延迟
- [x] 5.4.5 验证应用在整个过程中的稳定性
- [x] 5.4.6 断网测试：验证断网后应用仍可用（英文界面）
- [x] 5.4.7 快速切换测试：验证竞态条件已被避免（决策 1）

---

## 6. 文档更新（可选）

- [x] 6.1 更新 AGENTS.md 中的国际化相关说明
- [x] 6.2 记录性能优化的实测数据（区分最佳情况和典型情况）
- [x] 6.3 添加英文资源"第一公民"策略的架构说明
- [x] 6.4 添加 `loadingPromises` Map 的技术说明（决策 1）
- [x] 6.5 添加 Toast 降级方案的使用说明（决策 7）
