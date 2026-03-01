# 统一 Mock 策略系统实现任务

## 1. 基础设施搭建

- [x] 1.1 创建 `src/__test__/helpers/` 目录结构
- [x] 1.2 创建 `src/__test__/helpers/index.ts` 统一导出文件
- [x] 1.3 配置 `vite.config.ts` 添加 `@/test-helpers` 路径别名
- [x] 1.4 配置 `tsconfig.json` 添加 `@/test-helpers/*` 路径别名
- [x] 1.5 创建 `src/__test__/fixtures/` 目录

## 2. Mock 工厂实现

- [x] 2.1 创建 `src/__test__/helpers/mocks/index.ts` 导出文件
- [x] 2.2 实现 `createTauriMocks()` 工厂函数（支持 shell, os, http, store, keyring）
- [x] 2.3 实现 `createCryptoMocks()` 工厂函数（encryptField, decryptField, isEncrypted）
- [x] 2.4 实现 `createStorageMocks()` 工厂函数（createLazyStore, saveToStore, loadFromStore）
- [x] 2.5 为每个工厂实现 `resetAll()` 方法
- [x] 2.6 为每个工厂实现 `configure()` 方法
- [x] 2.7 添加 TypeScript 类型定义和 JSDoc 文档

## 3. Mock 配置中心实现

- [x] 3.1 创建 `src/__test__/helpers/mocks/setup.ts` 全局配置文件
- [x] 3.2 实现 `setupGlobalMocks()` 函数
- [x] 3.3 定义默认 Mock 策略配置
- [x] 3.4 实现三层配置优先级逻辑（全局 > 测试套件 > 单测试）
- [x] 3.5 创建 `MockConfigOptions` TypeScript 接口

## 4. 测试环境隔离实现

- [x] 4.1 创建 `src/__test__/helpers/isolation/index.ts` 导出文件
- [x] 4.2 实现 `resetTestState()` 函数（localStorage, Mock 调用, 模块缓存）
- [x] 4.3 实现 `useIsolatedTest()` 钩子函数
- [x] 4.4 实现 IndexedDB 隔离支持（`clearIndexedDB()` 函数）
- [x] 4.5 实现 `setTestEnv()` 环境变量隔离函数
- [x] 4.6 实现 `verifyIsolation()` 隔离验证函数

## 5. 测试数据工厂实现

- [x] 5.1 创建 `src/__test__/helpers/fixtures/index.ts` 导出文件
- [x] 5.2 实现 `createMockModel()` 函数（支持部分覆盖）
- [x] 5.3 实现 `createMockModels()` 批量创建函数
- [x] 5.4 实现 `createCryptoTestData()` 函数
- [x] 5.5 创建静态测试数据文件 `src/__test__/fixtures/test-data.json`

## 6. 自定义断言实现

- [x] 6.1 创建 `src/__test__/helpers/assertions/index.ts` 导出文件
- [x] 6.2 实现 `toBeEncrypted()` 断言
- [x] 6.3 实现 `toBeValidMasterKey()` 断言
- [x] 6.4 实现 `toHaveBeenCalledWithService()` 断言
- [x] 6.5 创建 `src/__test__/helpers/assertions/setup.ts` 自动扩展断言

## 7. Mock 验证工具实现

- [x] 7.1 实现 `verifyMockCalls()` 函数
- [x] 7.2 实现 `verifyMockCalledWith()` 函数
- [x] 7.3 实现 `measurePerformance()` 性能测试工具
- [x] 7.4 实现 `expectDuration()` 性能断言

## 8. setup.ts 重构

- [x] 8.1 重构 `setup.ts` 整合全局 Mock 系统（注：vi.mock() 需保留在顶层）
- [x] 8.2 导入并调用 `setupGlobalMocks()`
- [x] 8.3 导入自定义断言扩展
- [x] 8.4 保持向后兼容（现有测试不中断）

## 9. 单元测试

- [x] 9.1 为 `createTauriMocks()` 编写单元测试
- [x] 9.2 为 `createCryptoMocks()` 编写单元测试
- [x] 9.3 为 `createStorageMocks()` 编写单元测试
- [x] 9.4 为 `resetTestState()` 编写单元测试
- [x] 9.5 为 `createMockModel()` 编写单元测试
- [x] 9.6 为自定义断言编写单元测试

## 10. 迁移示例和文档

- [x] 10.1 选择一个现有测试文件作为迁移示例（如 `Button.test.tsx`）
- [x] 10.2 使用新 Mock 系统重写迁移示例
- [x] 10.3 更新 `AGENTS.md` 添加新 Mock 系统使用说明
- [x] 10.4 创建迁移指南文档（`docs/test-migration-guide.md`）
