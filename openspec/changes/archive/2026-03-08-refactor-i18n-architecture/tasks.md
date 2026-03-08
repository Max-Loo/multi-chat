# Tasks: 国际化架构重构

## 1. Phase 1: 基础重构（统一语言配置源）

**注意**：本阶段任务必须按顺序执行，特别是任务 1.3-1.5 必须在 1.8 之前完成。

 - [x] 1.1 在 `src/utils/constants.ts` 中添加 `LanguageConfig` 接口定义
 - [x] 1.2 在 `src/utils/constants.ts` 中添加 `LANGUAGE_CONFIGS` readonly 数组（包含 zh, en, fr 的配置）
 - [x] 1.3 在 `src/utils/constants.ts` 中派生 `SUPPORTED_LANGUAGE_LIST`（从 LANGUAGE_CONFIGS.map）
 - [x] 1.4 在 `src/utils/constants.ts` 中派生 `SUPPORTED_LANGUAGE_SET`（从 SUPPORTED_LANGUAGE_LIST）
 - [x] 1.5 在 `src/utils/constants.ts` 中派生 `SUPPORTED_LANGUAGE_MAP`（从 LANGUAGE_CONFIGS）
 - [x] 1.6 在 `src/utils/constants.ts` 中添加 `getLanguageConfig(code)` 辅助函数
 - [x] 1.7 修改 `src/lib/global.ts` 中的 `getLanguageLabel()` 函数，使用 `SUPPORTED_LANGUAGE_MAP.get(lang)?.label || lang`（添加降级逻辑）
 - [x] 1.8 修改 `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx`，从 `SUPPORTED_LANGUAGE_LIST` 派生语言选项
 - [x] 1.9 删除 `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx` 中的硬编码 `LANGUAGE_OPTIONS`
 - [x] 1.10 验证 TypeScript 编译通过（无类型错误）
- [ ] 1.11 手动测试：语言选择器显示正常，包含所有支持的选项
- [ ] 1.12 手动测试：验证 `getLanguageLabel()` 对于未知语言代码返回原代码（降级行为）

## 2. Phase 2: Toast 可靠性（消息队列机制）

 - [x] 2.1 创建 `src/lib/toastQueue.ts` 文件
 - [x] 2.2 在 `toastQueue.ts` 中定义 `QueuedToast` 接口
 - [x] 2.3 在 `toastQueue.ts` 中实现 `ToastQueue` 类（包含 markReady, enqueue, flush, show 方法）
 - [x] 2.4 在 `ToastQueue` 类中添加 `isFlushing` 标志，防止并发 flush 调用
 - [x] 2.5 在 `enqueue()` 方法中添加并发安全逻辑（仅当不在 flush 时才立即显示新消息）
 - [x] 2.6 在 `toastQueue.ts` 中实现顺序显示逻辑（flush 使用 async/await，每个消息间隔 500ms）
 - [x] 2.7 在 `toastQueue.ts` 中导出 `toastQueue` 单例
- [ ] 2.8 修改 `src/lib/i18n.ts`，导入 `toastQueue`
 - [x] 2.9 在 `src/lib/i18n.ts` 的 `initI18n()` 函数中，用 `toastQueue.enqueue()` 替换所有 `toastFunc?.info/warning()` 调用
 - [x] 2.10 删除 `src/lib/i18n.ts:24-37` 的旧动态导入 toast 逻辑
 - [x] 2.11 删除 `src/lib/i18n.ts` 中的 `toastFunc` 变量及相关 try-catch 代码
 - [x] 2.12 修改 `src/main.tsx`，在 Toaster 组件挂载后调用 `toastQueue.markReady()`
 - [x] 2.13 验证 TypeScript 编译通过
- [ ] 2.14 手动测试：启动应用时能看到语言迁移/降级提示 Toast（顺序显示）
- [ ] 2.15 手动测试：运行时语言切换 Toast 正常显示
- [ ] 2.16 手动测试：多个 Toast 消息按顺序显示，用户有时间阅读每个消息
- [ ] 2.17 手动测试：在 flush 执行期间调用 enqueue，验证新消息正确排队（不会并发显示）

## 3. Phase 3: 自动持久化（Redux Middleware）

 - [x] 3.1 创建 `src/store/middleware/languagePersistence.ts` 文件
 - [x] 3.2 在 `languagePersistence.ts` 中实现 `createLanguagePersistenceMiddleware()` 函数
 - [x] 3.3 在 middleware 中使用 `action.type.endsWith('/setAppLanguage')` 监听 action（兼容 Redux Toolkit 环境前缀）
 - [x] 3.4 在 middleware 中添加 `action.payload` 类型检查（`typeof action.payload === 'string'`）
 - [x] 3.5 在 middleware 中实现 `localStorage.setItem()` 调用，带 try-catch 错误处理
 - [x] 3.6 在 middleware 中添加静默降级逻辑（console.warn，不抛出错误）
 - [x] 3.7 修改 `src/store/index.ts`，导入 `createLanguagePersistenceMiddleware`
 - [x] 3.8 在 `src/store/index.ts` 的 `configureStore` 中集成 middleware
 - [x] 3.9 修改 `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx` 的 `onLangChange` 函数
 - [x] 3.10 删除 `LanguageSetting.tsx:46-50` 的手动 `localStorage.setItem()` 调用
 - [x] 3.11 验证 TypeScript 编译通过
- [ ] 3.12 手动测试：切换语言后 localStorage 正确更新
- [ ] 3.13 手动测试：localStorage 写入失败时应用正常运行（可使用浏览器 DevTools 模拟）
- [ ] 3.14 单元测试：验证 middleware 对非字符串 payload 的处理（console.warn，不写入 localStorage）
- [ ] 3.15 单元测试：验证 `endsWith()` 匹配逻辑在开发/生产环境下均正常工作

## 4. Phase 4: 清理和测试

 - [x] 4.1 全局搜索 `LANGUAGE_LABELS`，确认无遗漏引用（特别注意 `src/lib/global.ts`）
 - [x] 4.2 全局搜索旧的 `toastFunc` 变量，确认无遗漏引用
 - [x] 4.3 删除 `src/lib/i18n.ts` 中所有废弃的 toast 相关代码
 - [x] 4.4 删除 `src/lib/global.ts` 中重复的 `LOCAL_STORAGE_LANGUAGE_KEY` 定义（如存在）
- [ ] 4.5 为 `ToastQueue` 类添加单元测试（测试 markReady, enqueue, flush 逻辑，包括并发安全验证和顺序显示）
- [ ] 4.6 为 `languagePersistence` middleware 添加单元测试（包括类型检查、错误处理、endsWith 匹配逻辑）
- [ ] 4.7 为 `getLanguageLabel()` 添加单元测试（验证降级逻辑：未知语言代码返回原代码）
- [ ] 4.8 添加集成测试：使用 Testing Library 验证 toastQueue 在应用初始化时的行为（mock Toaster 组件，验证 markReady 后消息正确显示）
- [ ] 4.9 添加端到端测试：使用 Playwright/Cypress 验证语言切换的完整流程（包括 localStorage 持久化和重启恢复）
- [ ] 4.10 验证现有国际化相关测试仍然通过（如 `i18n-unit-testing`、`i18n-lazy-loading`）
- [ ] 4.11 端到端测试：验证所有语言切换场景（zh ↔ en ↔ fr）
- [ ] 4.12 端到端测试：验证应用重启后语言偏好保持
- [ ] 4.13 端到端测试：验证 localStorage 写入失败时的降级行为
- [ ] 4.14 代码审查：确认所有变更符合设计文档
- [ ] 4.15 性能测试：验证无明显的性能回归

## 5. 文档和收尾

  - [x] 5.1 检查 AGENTS.md 的国际化章节，确认是否需要更新架构说明（如有新的配置或流程变更）
  - [x] 5.2 检查 README.md 是否提到 `LANGUAGE_LABELS` 或相关配置（如无则跳过）
  - [x] 5.3 删除临时文件 `openspec/changes/refactor-i18n-architecture/architecture-diagrams.md`（已整合到 design.md）
  - [ ] 5.4 验证生产环境构建成功（`pnpm tauri build`）
