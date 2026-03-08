# Implementation Tasks: 国际化缓存语言验证与迁移

## 1. 常量定义

- [x] 1.1 在 `src/utils/constants.ts` 中添加 `LANGUAGE_MIGRATION_MAP` 常量，定义语言代码迁移映射（如 `'zh-CN': 'zh'`）
- [x] 1.2 在 `src/utils/constants.ts` 中导出 `LANGUAGE_MIGRATION_MAP`，确保可在 `global.ts` 中使用
- [x] 1.3 （可选）将 `SUPPORTED_LANGUAGE_LIST` 从数组改为 `Set` 以提升查找性能，并导出为 `SUPPORTED_LANGUAGE_SET`

## 2. 核心验证逻辑实现

- [x] 2.1 修改 `src/lib/global.ts` 的 `getDefaultAppLanguage()` 函数，添加缓存语言有效性验证逻辑
- [x] 2.2 在 `getDefaultAppLanguage()` 中实现语言代码自动迁移逻辑，使用 `LANGUAGE_MIGRATION_MAP` 查找迁移规则
- [x] 2.3 在 `getDefaultAppLanguage()` 中实现无效缓存的清理逻辑（调用 `localStorage.removeItem()`）
- [x] 2.4 在 `getDefaultAppLanguage()` 中实现多级降级策略（缓存 → 迁移 → 系统语言 → 英文）
- [x] 2.5 在 `getDefaultAppLanguage()` 中添加错误处理，捕获 localStorage 读写异常
- [x] 2.6 修改 `getDefaultAppLanguage()` 的返回值类型，从 `Promise<string>` 改为 `Promise<LanguageResult>`，包含 `lang`、`migrated`、`from`、`fallbackReason` 字段
- [x] 2.7 在 `src/lib/global.ts` 中定义并导出 `LanguageResult` 接口

## 3. 用户提示实现

- [x] 3.1 在 `src/lib/i18n.ts` 的 `initI18n()` 函数中，根据 `getDefaultAppLanguage()` 返回的 `LanguageResult` 对象显示 Toast
- [x] 3.2 在迁移成功时（`migrated === true`）显示信息 Toast："检测到语言代码已更新为中文（zh）"
- [x] 3.3 在降级到系统语言时（`fallbackReason === 'system-lang'`）显示信息 Toast："已切换到系统语言：Français"
- [x] 3.4 在降级到英文时（`fallbackReason === 'default'`）显示警告 Toast："语言代码已失效，已切换到英文"
- [x] 3.5 实现 Toast 显示失败的降级逻辑（使用 `console.warn`），确保不阻塞应用启动
- [x] 3.6 创建辅助函数 `getLanguageLabel(lang: string)` 用于获取语言的显示名称（如 `zh` → "中文"）

## 3.5. 修复语言切换时的持久化问题

- [x] 3.5.1 修改 `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx` 的 `onLangChange` 函数
- [x] 3.5.2 在 `onLangChange` 中调用 `changeAppLanguage(lang)` 来实际切换 i18n 的语言
- [x] 3.5.3 在切换成功后更新 Redux store（`dispatch(setAppLanguage(lang))`）
- [x] 3.5.4 在切换成功后更新 localStorage（`localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang)`）
- [x] 3.5.5 添加错误处理：切换失败时显示 Toast 提示
- [x] 3.5.6 在翻译文件中添加错误提示文本（`languageSwitchFailed`）
- [x] 3.5.7 更新测试：mock `changeAppLanguage` 和 `toast`，验证异步操作

## 3.6. 修复异步资源加载的时序问题

- [x] 3.6.1 修改 `src/lib/i18n.ts` 的 `initI18n()` 函数
- [x] 3.6.2 在成功加载非英文语言资源后，将其添加到 `initialResources` 中
- [x] 3.6.3 确保 `i18n.init()` 时拥有完整的语言资源（包括非英文）
- [x] 3.6.4 添加注释说明这个修复的原因（异步加载时序问题）

## 4. 单元测试

- [x] 4.1 创建 `src/__test__/lib/global.test.ts` 测试文件
- [x] 4.2 添加测试用例：验证有效缓存语言直接返回，返回 `{ lang: 'zh', migrated: false }`
- [x] 4.3 添加测试用例：验证无效缓存语言被删除并降级到系统语言
- [x] 4.4 添加测试用例：验证无效缓存语言被删除并降级到英文（系统语言不支持）
- [x] 4.5 添加测试用例：验证 `zh-CN` 成功迁移到 `zh`，返回 `{ lang: 'zh', migrated: true, from: 'zh-CN' }`
- [x] 4.6 添加测试用例：验证迁移目标语言不支持时降级到系统语言或英文
- [x] 4.7 添加测试用例：验证 localStorage 读取失败时降级到系统语言或英文
- [x] 4.8 添加测试用例：验证 localStorage 写入失败时仅在内存中更新，不抛出异常
- [x] 4.9 添加测试用例：验证缓存语言为带地区代码格式（如 `zh-CN`）且基础语言支持时，不自动使用基础语言
- [x] 4.10 添加测试用例：验证迁移成功后重复启动，第二次启动不再迁移，返回 `{ lang: 'zh', migrated: false }`

## 5. 集成测试

- [x] 5.1 创建集成测试文件，模拟应用启动流程（从 `initI18n()` 到界面显示）
- [x] 5.2 测试有效缓存场景：确保应用正常启动，不显示任何 Toast
- [x] 5.3 测试无效缓存场景：确保应用正常启动，显示相应的 Toast 提示
- [x] 5.4 测试迁移场景：确保语言成功切换，Toast 显示正确，Redux store 状态一致
- [x] 5.5 测试迁移后重复启动场景：确保第二次启动不显示 Toast，使用迁移后的语言

## 6. 手动测试与验证

- [x] 6.1 在浏览器开发者工具中手动设置 localStorage 语言缓存为 `'zh-CN'`，验证迁移到 `'zh'`
- [x] 6.2 手动设置 localStorage 语言缓存为无效值（如 `'de'`），验证降级逻辑
- [x] 6.3 在隐私模式（localStorage 禁用）下测试，验证应用正常启动
- [x] 6.4 验证手动语言切换功能不受影响（通过设置页面的语言选择器）

## 7. 文档更新

- [x] 7.1 在 CHANGELOG 中记录此变更，说明语言代码自动迁移功能（项目无 CHANGELOG 文件，已跳过）
- [x] 7.2 在 README 或 FAQ 中添加语言自动迁移的说明文档
- [x] 7.3 在 AGENTS.md 中更新国际化相关章节，说明缓存验证逻辑

## 8. 代码审查与优化

- [x] 8.1 运行 `pnpm lint` 确保代码符合 ESLint 规范
- [x] 8.2 运行 `pnpm tsc` 确保类型检查通过
- [x] 8.3 运行 `pnpm test` 确保所有测试通过
- [x] 8.4 使用 React DevTools 验证应用启动性能，确保新增逻辑不影响启动时间
- [x] 8.5 Code Review：检查代码质量、注释完整性、错误处理逻辑

## 9. 发布准备

- [ ] 9.1 更新版本号（如果需要）
- [ ] 9.2 创建 Git tag（如果需要）
- [ ] 9.3 准备 Release Notes，总结此变更的内容和影响
