# 实施任务清单

## 1. 创建 OS 插件兼容层

- [x] 1.1 在 `src/utils/tauriCompat/` 目录下创建 `os.ts` 文件
- [x] 1.2 实现 `locale()` 兼容函数（Tauri 环境调用原生 API，Web 环境使用 navigator.language）
- [x] 1.3 添加完整的中文 JSDoc 注释，说明函数用途和环境行为差异
- [x] 1.4 在 `src/utils/tauriCompat/index.ts` 中导出 `locale` 函数
- [x] 1.5 运行 TypeScript 类型检查 (`pnpm tsc`) 确保无类型错误

## 2. 更新代码使用兼容层

- [x] 2.1 修改 `src/lib/global.ts`：将 `import { locale } from '@tauri-apps/plugin-os'` 改为 `import { locale } from '@/utils/tauriCompat'`
- [x] 2.2 在 `src/lib/global.ts` 中移除对 `@tauri-apps/plugin-os` 的导入
- [x] 2.3 验证 `getDefaultAppLanguage()` 函数正常工作（检查 locale() 调用）
- [x] 2.4 在 `ChatPanelSender.tsx` 中移除 `import { platform } from '@tauri-apps/plugin-os'`
- [x] 2.5 在 `ChatPanelSender.tsx` 中创建 `isMacSafari()` 检测函数（使用 navigator.userAgent）
- [x] 2.6 在 `ChatPanelSender.tsx` 的 `onPressEnterBtn` 函数中，将 `platform()` 调用替换为 `isMacSafari()`
- [x] 2.7 为 `isMacSafari()` 函数添加中文注释，说明其用途和检测逻辑

## 3. 类型安全验证

- [x] 3.1 运行 `pnpm tsc` 确保整个项目无 TypeScript 类型错误
- [x] 3.2 检查 `locale()` 函数的返回类型是否为 `string`
- [x] 3.3 确认兼容层类型与 `@tauri-apps/plugin-os` 原生类型一致
- [x] 3.4 验证编译后的代码中不包含对 `@tauri-apps/plugin-os` 的直接引用（除兼容层内部）

## 4. Tauri 环境测试

- [ ] 4.1 运行 `pnpm tauri dev` 启动 Tauri 桌面环境
- [ ] 4.2 验证应用正常启动，无运行时错误
- [ ] 4.3 检查控制台日志，确认 `locale()` 返回正确的系统语言
- [ ] 4.4 测试国际化功能，确认应用语言与系统语言一致
- [ ] 4.5 在 ChatPanel 中测试中文输入法，确认 macOS Safari bug 修复逻辑正常工作
- [ ] 4.6 验证所有使用 `locale()` 的功能正常

## 5. Web 环境测试

- [ ] 5.1 运行 `pnpm web:dev` 启动 Web 浏览器环境
- [ ] 5.2 验证应用正常启动，无运行时错误
- [ ] 5.3 检查控制台日志，确认 `locale()` 返回浏览器语言（navigator.language）
- [ ] 5.4 测试国际化功能，确认应用使用浏览器语言
- [ ] 5.5 在不同浏览器中测试（Chrome、Firefox、Safari、Edge）
- [ ] 5.6 在 macOS Safari 中测试，确认 `isMacSafari()` 检测逻辑正确
- [ ] 5.7 验证所有使用 `locale()` 的功能在 Web 环境正常工作

## 6. 代码质量检查

- [x] 6.1 运行 `pnpm lint` 确保代码符合 ESLint 规范
- [x] 6.2 检查所有新增代码的中文注释是否完整
- [x] 6.3 验证遵循 KISS 和 DRY 原则（无不必要的抽象，无重复代码）
- [x] 6.4 确认导入路径使用 `@/` 别名而非相对路径
- [x] 6.5 检查代码是否符合单一职责原则

## 7. 文档更新

- [x] 7.1 在 AGENTS.md 的"跨平台兼容性"章节中添加 OS 插件兼容层说明
- [x] 7.2 在"已实现兼容层"列表中添加 OS 插件（locale）的说明
- [x] 7.3 添加使用示例：如何导入和使用 `locale()` 函数
- [x] 7.4 说明 Web 环境使用浏览器语言的行为
- [x] 7.5 添加平台检测逻辑替换的说明（ChatPanelSender 组件）
- [x] 7.6 更新"为其他插件添加兼容层"章节，说明 OS 插件作为参考示例

## 8. 最终验证

- [ ] 8.1 在 Tauri 环境中进行完整的功能回归测试
- [ ] 8.2 在 Web 环境中进行完整的功能回归测试
- [ ] 8.3 确认两种环境的构建流程均成功（`pnpm tauri build` 和 `pnpm web:build`）
- [x] 8.4 检查 git diff，确认所有变更符合预期
- [x] 8.5 验证不影响现有的 Shell 插件兼容层功能
- [x] 8.6 确认无引入新的依赖或破坏性变更（除 proposal 中声明的 breaking change）

## 9. 清理和优化

- [x] 9.1 移除未使用的导入和变量
- [x] 9.2 检查是否有调试用的 console.log 需要移除
- [x] 9.3 优化代码结构和命名，确保可读性
- [x] 9.4 确认所有 TODO 注释已处理或记录
