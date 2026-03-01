# 实施任务清单

## 1. 准备工作

- [x] 1.1 创建 `src/lib/initialization/` 目录结构
- [x] 1.2 创建 `src/components/InitializationScreen/` 目录
- [x] 1.3 创建 `src/components/FatalErrorScreen/` 目录
- [x] 1.4 创建 `src/config/` 目录（如果不存在）
- [x] 1.5 更新国际化文件 `src/locales/zh/common.json`，添加错误提示文本
- [x] 1.6 更新国际化文件 `src/locales/en/common.json`，添加错误提示文本

## 2. 核心类型定义

- [x] 2.1 创建 `src/lib/initialization/types.ts`，定义 `InitStep` 接口
- [x] 2.2 定义 `ExecutionContext` 接口
- [x] 2.3 定义 `InitResult` 接口
- [x] 2.4 定义 `InitConfig` 接口
- [x] 2.5 定义 `ErrorSeverity` 类型（'fatal' | 'warning' | 'ignorable'）
- [ ] 2.6 编写类型定义的单元测试（如果需要）

## 3. InitializationManager 实现

- [x] 3.1 创建 `src/lib/initialization/InitializationManager.ts` 文件
- [x] 3.2 实现 `ExecutionContext` 类（使用 Map 存储结果）
- [x] 3.3 实现 `InitializationManager` 类的 `runInitialization()` 方法
- [x] 3.4 实现依赖关系验证逻辑（检查依赖是否存在）
- [x] 3.5 实现循环依赖检测逻辑
- [x] 3.6 实现拓扑排序算法（构建执行计划）
- [x] 3.7 实现步骤执行逻辑（并行执行同组步骤）
- [x] 3.8 实现错误处理逻辑（根据严重程度分类错误）
- [x] 3.9 添加进度回调支持（`onProgress`）
- [ ] 3.10 编写 `InitializationManager` 的单元测试
- [x] 3.11 创建 `src/lib/initialization/index.ts`，导出所有公共 API

## 4. UI 组件实现

- [x] 4.1 实现 `src/components/InitializationScreen/index.tsx`（骨架屏动画）
- [x] 4.2 实现 `src/components/FatalErrorScreen/index.tsx`（全屏错误提示）
- [x] 4.3 在 `FatalErrorScreen` 中添加刷新页面按钮
- [x] 4.4 在开发模式下显示错误堆栈（`<details>` 元素）
- [x] 4.5 为多个错误添加独立的 `<Alert>` 组件展示
- [ ] 4.6 编写 UI 组件的测试用例

## 5. 现有模块适配

- [x] 5.1 修改 `src/lib/i18n.ts`，移除 `initI18n()` 中的 try-catch
- [x] 5.2 确保 `initI18n()` 在失败时抛出错误
- [x] 5.3 验证 `initializeMasterKey()` 的实现（无需修改）
- [x] 5.4 验证 Redux Thunk 函数的实现（无需修改）

## 6. 初始化步骤配置

- [x] 6.1 创建 `src/config/initSteps.ts` 文件
- [x] 6.2 定义 `i18n` 步骤（关键步骤，无依赖）
- [x] 6.3 定义 `masterKey` 步骤（关键步骤，无依赖，存入 context）
- [x] 6.4 定义 `models` 步骤（非关键，依赖 `masterKey`，使用 `.unwrap()`）
- [x] 6.5 定义 `chatList` 步骤（非关键，使用 `.unwrap()`）
- [x] 6.6 定义 `appLanguage` 步骤（非关键，依赖 `i18n`）
- [x] 6.7 定义 `includeReasoningContent` 步骤（非关键）
- [x] 6.8 定义 `modelProvider` 步骤（非关键，使用 `.unwrap()`）
- [x] 6.9 为每个步骤添加适当的 `onError` 回调
- [x] 6.10 导出 `initSteps` 数组

## 7. main.tsx 重构

- [x] 7.1 在 `main.tsx` 中导入 `InitializationManager` 和 `initSteps`
- [x] 7.2 移除旧的阻断式初始化逻辑（`Promise.all`）
- [x] 7.3 移除旧的并行初始化逻辑（`store.dispatch` 调用）
- [x] 7.4 使用 `InitializationManager.runInitialization()` 执行初始化
- [x] 7.5 先渲染 `<InitializationScreen />`（替代旧的 `<FullscreenLoading />`）
- [x] 7.6 根据初始化结果渲染不同界面：
  - [x] 7.6.1 如果 `result.success === false`，渲染 `<FatalErrorScreen />`
  - [x] 7.6.2 如果 `result.success === true`，检查 `modelProvider` 的致命错误
  - [x] 7.6.3 如果有 `modelProvider` 致命错误，渲染 `<NoProvidersAvailable />`
  - [x] 7.6.4 否则，渲染 `<RouterProvider />`、`<Toaster />` 等
- [x] 7.7 在初始化成功后显示警告错误 Toast（`result.warnings`）
- [x] 7.8 保留 `handleSecurityWarning()` 调用（应用渲染后执行）
- [x] 7.9 移除对 `AppRoot` 组件的导入和使用

## 8. 清理工作

- [x] 8.1 删除 `src/components/AppRoot.tsx` 文件
- [x] 8.2 删除 `src/components/FullscreenLoading/` 目录
- [x] 8.3 移除不再使用的导入（如果有）
- [x] 8.4 检查是否有其他文件引用了 `AppRoot` 或 `FullscreenLoading`
- [x] 8.5 更新相关导入路径（如果有）

## 9. 测试与验证

- [ ] 9.1 测试正常初始化流程（所有步骤成功）
- [ ] 9.2 测试致命错误场景（如 `initI18n` 失败）
- [ ] 9.3 测试警告错误场景（如 `modelProvider` 获取失败但使用缓存）
- [ ] 9.4 测试可忽略错误场景（如统计初始化失败）
- [ ] 9.5 测试依赖关系（验证步骤按正确顺序执行）
- [ ] 9.6 测试并行执行（验证无依赖的步骤并行执行）
- [ ] 9.7 测试循环依赖检测（手动创建循环依赖并验证错误提示）
- [ ] 9.8 测试依赖不存在的情况（手动引用不存在的步骤并验证错误提示）
- [ ] 9.9 测试错误信息国际化（切换语言并验证错误消息）
- [ ] 9.10 测试开发模式下的错误堆栈显示
- [ ] 9.11 测试刷新页面功能（点击刷新按钮并验证页面重新加载）
- [ ] 9.12 测试 Toast 自动关闭功能
- [ ] 9.13 测试向后兼容性（验证其他代码中的函数调用不受影响）
- [ ] 9.14 性能测试（验证初始化速度没有明显下降）

## 10. 文档与代码审查

- [x] 10.1 更新 AGENTS.md 中的初始化流程说明
- [x] 10.2 更新 README.md（不需要，重构不影响用户文档）
- [x] 10.3 为 `InitializationManager` 添加 JSDoc 注释
- [x] 10.4 为 `InitStep` 和 `ExecutionContext` 添加 JSDoc 注释
- [x] 10.5 为 `initSteps.ts` 添加注释说明每个步骤的作用
- [ ] 10.6 进行代码审查，确保代码质量
- [x] 10.7 运行 `pnpm lint` 检查代码规范
- [x] 10.8 运行 `pnpm tsc` 检查类型错误（已修复）
- [x] 10.9 运行 `pnpm test:run` 确保所有测试通过
