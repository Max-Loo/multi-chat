# global.ts 模块单元测试 - 实现任务清单

## 1. 测试环境设置

- [x] 1.1 创建测试文件 `src/__test__/lib/global.test.ts`
- [x] 1.2 使用 `vi.hoisted()` 创建 Mock 函数（`mockShellOpen`、`mockLocale`）
- [x] 1.3 配置 `@/utils/tauriCompat` 的 Mock（`shell.open`、`locale`）
- [x] 1.4 设置测试组结构和 `beforeEach`/`afterEach` 钩子

## 2. getDefaultAppLanguage() 测试实现

- [x] 2.1 实现 localStorage 优先级测试（返回 localStorage 中的语言）
- [x] 2.2 实现系统语言检测测试（返回支持的系统语言前缀）
- [x] 2.3 实现不支持系统语言时的回退测试（返回 'en'）
- [x] 2.4 实现所有检测失败时的默认测试（返回 'en'）
- [x] 2.5 添加边界情况测试（localStorage 空值、系统 locale 格式异常等）

## 3. interceptClickAToJump() 测试实现

- [x] 3.1 实现外部链接拦截测试（验证 `preventDefault` 和 `shell.open` 调用）
- [x] 3.2 实现内部链接不拦截测试（不调用 `shell.open`）
- [x] 3.3 实现非 a 标签元素忽略测试
- [x] 3.4 实现嵌套 a 标签识别测试（使用 `closest('a')`）
- [x] 3.5 实现全局事件监听器清理逻辑（`afterEach` 移除监听器）
- [x] 3.6 添加边界情况测试（无 href 属性、无效 URL 等）

## 4. 测试覆盖率验证

- [x] 4.1 运行 `pnpm test:coverage` 生成覆盖率报告
- [x] 4.2 检查 `src/lib/global.ts` 的语句覆盖率是否达到 100%
- [x] 4.3 补充遗漏的测试用例（如果有未覆盖的代码路径）
- [x] 4.4 验证所有测试通过（无失败或跳过）

## 5. 代码质量检查

- [x] 5.1 运行 `pnpm lint` 确保代码符合 ESLint 规范
- [x] 5.2 运行 `pnpm tsc` 确保类型检查通过
- [x] 5.3 检查测试代码的可读性和维护性
- [x] 5.4 添加必要的测试注释（解释复杂场景）

## 6. 文档更新

- [x] 6.1 更新 AGENTS.md 中的测试覆盖率统计（如适用）


