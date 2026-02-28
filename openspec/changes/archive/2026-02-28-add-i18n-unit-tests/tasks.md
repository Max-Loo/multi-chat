## 1. 测试文件设置

- [x] 1.1 创建测试文件 `src/__test__/lib/i18n.test.ts`
- [x] 1.2 安装和配置 Vitest 相关依赖（如果需要）
- [x] 1.3 设置测试文件的基本结构（describe 嵌套）

## 2. Mock 配置

- [x] 2.1 Mock `i18next` 库（vi.mock）
- [x] 2.2 Mock `react-i18next` 的 `initReactI18next`
- [x] 2.3 Mock Vite 的 `import.meta.glob` API
- [x] 2.4 Mock `../lib/global` 中的 `getDefaultAppLanguage` 函数
- [x] 2.5 配置全局的 mock 数据（语言文件、默认语言等）

## 3. getLocalesResources 测试套件

- [x] 3.1 实现"成功加载多个语言文件"场景的测试
- [x] 3.2 实现"正确解析文件路径和命名空间"场景的测试
- [x] 3.3 实现"空的模块列表处理"场景的测试
- [x] 3.4 验证返回的数据结构符合预期

## 4. initI18n 测试套件

- [x] 4.1 实现"首次初始化成功"场景的测试
- [x] 4.2 实现"单例模式验证"场景的测试
- [x] 4.3 实现"初始化错误处理"场景的测试
- [x] 4.4 验证 i18next.init 的调用参数正确
- [x] 4.5 验证 Promise 并行执行（getLocalesResources 和 getDefaultAppLanguage）

## 5. getInitI18nPromise 测试套件

- [x] 5.1 实现"已初始化时返回缓存的 Promise"场景的测试
- [x] 5.2 实现"未初始化时触发初始化"场景的测试
- [x] 5.3 验证返回的 Promise 实例一致性

## 6. changeAppLanguage 测试套件

- [x] 6.1 实现"成功切换语言"场景的测试
- [x] 6.2 实现"切换到不支持的语言"场景的测试
- [x] 6.3 验证 i18next.changeLanguage 被正确调用

## 7. 测试隔离和清理

- [x] 7.1 在每个测试后添加 `vi.clearAllMocks()`
- [x] 7.2 在每个测试后添加 `vi.resetModules()`
- [x] 7.3 配置 `beforeEach` 设置独立的测试数据
- [x] 7.4 验证测试之间没有状态污染

## 8. 覆盖率验证和优化

- [x] 8.1 运行 `pnpm test:coverage` 生成覆盖率报告
- [x] 8.2 检查 `src/lib/i18n.ts` 的语句覆盖率
- [x] 8.3 如覆盖率 <70%，补充缺失的测试用例
- [x] 8.4 验证所有导出函数都有测试覆盖
- [x] 8.5 验证主要的代码路径都被测试覆盖

## 9. 代码质量检查

- [x] 9.1 运行 `pnpm lint` 确保代码风格符合规范
- [x] 9.2 运行 `pnpm tsc` 确保类型检查通过
- [x] 9.3 运行 `pnpm test:run` 确保所有测试通过
- [x] 9.4 代码审查和优化（如有必要）


