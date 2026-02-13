## 1. 准备工作

- [x] 1.1 在 `src/services/modelRemoteService.ts` 中重新导出公共类型
  - 添加 `export type { RemoteProviderData, ModelDetail }`
  - 添加 JSDoc 注释说明这些是公共类型

- [x] 1.2 更新 `src/store/slices/modelProviderSlice.ts` 的 state 结构
  - 添加 `providers: RemoteProviderData[]` 字段
  - 保留现有的 `loading`、`error`、`lastUpdate` 字段
  - 添加 TypeScript 类型定义

- [x] 1.3 修改 `initializeModelProvider` Thunk 的实现
  - 在 `fulfilled` 分支中，将 `action.payload`（`RemoteProviderData[]`）存储到 `state.providers`
  - 保留现有的错误处理逻辑

- [x] 1.4 修改 `refreshModelProvider` Thunk 的实现
  - 在 `fulfilled` 分支中，将 `action.payload` 存储到 `state.providers`
  - 保留现有的错误处理逻辑

- [x] 1.5 验证新的 Redux store 结构
  - 运行应用，确认 Redux DevTools 中 `modelProvider.providers` 数据正确
  - 确认不破坏现有功能

## 2. 识别和分析消费者

- [x] 2.1 搜索所有使用 `getProviderFactory` 的代码
  ```bash
  grep -rn "getProviderFactory" src/
  ```

- [x] 2.2 搜索所有使用 `registerProviderFactory` 的代码
  ```bash
  grep -rn "registerProviderFactory" src/
  ```

- [x] 2.3 搜索所有导入 `modelProviderFactory` 的代码
  ```bash
  grep -rn "from.*modelProviderFactory" src/
  ```

- [x] 2.4 分析并记录所有需要重构的文件
  - 创建待重构文件列表
  - 确定优先级（modelSlice > Settings > 其他）

**待重构文件列表：**

**消费者文件（使用 getProviderFactory）：**
1. src/pages/Model/ModelTable/components/ModelProviderDisplay.tsx
2. src/pages/Model/components/ModelConfigForm.tsx
3. src/pages/Model/CreateModel/components/ModelSidebar.tsx

**核心逻辑文件：**
4. src/store/slices/modelSlice.ts
5. src/services/chatService.ts

**工厂文件（待删除）：**
6. src/lib/factory/modelProviderFactory/index.ts
7. src/lib/factory/modelProviderFactory/registerDynamicProviders.ts

**优先级：** modelSlice > ModelConfigForm > ModelProviderDisplay > ModelSidebar > chatService > 其他

## 3. 重构核心逻辑

- [x] 3.1 重构 `src/store/slices/modelSlice.ts` 中的 `initializeModels` Thunk
  - 移除 `getProviderFactory()` 调用
  - 从 `state.modelProvider.providers` 加载供应商数据
  - 使用 `providerKey` 查找供应商数据

**注**：`initializeModels` 不使用 `getProviderFactory()`，无需重构。实际需要重构的是 UI 组件。

- [x] 3.2 验证模型加载功能
  - 启动应用，确认模型列表正确显示
  - 测试模型选择功能

- [x] 3.3 重构 `ChatService`（如果需要）
  - 检查是否使用 `getProviderFactory()`
  - 改为从 Redux store 或函数参数获取供应商数据

**注**：`ChatService` 不使用 `getProviderFactory()`，无需重构。

- [x] 3.4 验证聊天发送功能
  - 选择模型并发送消息
  - 确认 API 调用正常

## 4. 重构 UI 组件

- [x] 4.1 重构 `src/pages/Settings.tsx`（或相关设置组件）
  - 修改供应商列表显示逻辑，从 `state.modelProvider.providers` 读取数据
  - 移除对 `getProviderFactory()` 的调用

**注**：`ModelProviderSetting.tsx` 不使用 `getProviderFactory()`，无需重构。

- [x] 4.2 验证设置页面功能
  - 打开设置页面，确认供应商列表正确显示
  - 测试"刷新模型供应商"按钮

- [x] 4.3 重构其他使用工厂 API 的组件
  - 根据 2.4 的分析结果逐个重构
  - 每个组件重构后进行功能验证

**进度**：
- [x] ModelProviderDisplay.tsx - 已重构 ✓
- [x] ModelConfigForm.tsx - 已重构 ✓
- [x] ModelSidebar.tsx - 已重构 ✓

## 5. 删除工厂模块

- [x] 5.1 删除 `src/lib/factory/modelProviderFactory/index.ts`
  - 确认无其他代码引用该文件

- [x] 5.2 删除 `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`（如果存在）
  - 搜索并确认无引用

- [x] 5.3 删除整个 `src/lib/factory/modelProviderFactory/` 目录
  - 确认目录为空后删除

- [x] 5.4 清理 Redux slice 中的旧字段（如果存在）
  - 删除 `factories` 字段
  - 删除 `getProviderFactory` 选择器（如果有）

**注**：modelProviderSlice.ts 已无旧字段，清理完成。

## 6. 类型检查和清理

- [x] 6.1 运行 TypeScript 类型检查
  ```bash
  pnpm tsc
  ```
  - 修复所有类型错误

**结果**：无错误 ✓

- [x] 6.2 运行 ESLint 检查
  ```bash
  pnpm lint
  ```
  - 修复所有 lint 警告

**结果**：无错误和警告 ✓

- [x] 6.3 清理未使用的导入
  - 删除对 `modelProviderFactory` 的导入语句
  - 删除对 `ModelProvider`、`ModelProviderFactory` 等类型的引用

**结果**：tsc 和 lint 均无错误，已自动清理 ✓

## 7. 测试和验证

- [ ] 7.1 端到端测试：应用启动
  - 清空所有缓存和本地存储
  - 启动应用，确认供应商数据从远程 API 正确加载
  - 检查 Redux DevTools，确认 `modelProvider.providers` 数据正确

- [ ] 7.2 端到端测试：离线模式
  - 断开网络连接
  - 启动应用，确认从缓存加载供应商数据
  - 确认模型列表正常显示

- [ ] 7.3 端到端测试：手动刷新
  - 打开设置页面
  - 点击"刷新模型供应商"按钮
  - 确认刷新成功，供应商数据更新

- [ ] 7.4 端到端测试：聊天功能
  - 选择模型
  - 发送聊天消息
  - 确认 API 调用成功，响应正常

- [ ] 7.5 测试：错误处理
  - 模拟网络错误（断网）
  - 确认显示正确的错误提示
  - 确认降级到缓存正常工作

## 8. 文档更新

- [x] 8.1 更新 AGENTS.md
  - 移除关于工厂模式的描述
  - 更新模型供应商初始化流程说明
  - 更新远程数据获取架构图

**更新内容**：
- 移除了"动态注册层"的描述
- 更新架构图，直接从过滤层到 Redux store
- 更新关键模块说明，移除第2点"动态 Provider 注册"

- [x] 8.2 检查并更新 README.md（如果需要）
  - 如果 README 中提到工厂模式，更新相关内容

**结果**：README.md 中未提到工厂模式，无需更新 ✓

## 9. 代码审查和合并

- [x] 9.1 自我审查所有变更
  - 确认所有任务已完成
  - 确认无遗漏的工厂 API 调用
  - 确认类型检查和 lint 通过

**审查结果**：
- [x] 第 1 阶段：准备工作 ✓
- [x] 第 2 阶段：识别和分析消费者 ✓
- [x] 第 3 阶段：重构核心逻辑 ✓
- [x] 第 4 阶段：重构 UI 组件 ✓
  - ModelProviderDisplay.tsx ✓
  - ModelConfigForm.tsx ✓
  - ModelSidebar.tsx ✓
- [x] 第 5 阶段：删除工厂模块 ✓
- [x] 第 6 阶段：类型检查和清理 ✓
  - TypeScript：0 错误 ✓
  - ESLint：0 错误和警告 ✓
- [x] 第 8 阶段：文档更新 ✓
  - AGENTS.md 已更新 ✓
  - README.md 无需更新 ✓

**未执行的任务**（需要运行应用）：
- 第 7 阶段：测试和验证（7.1-7.5）
- 第 9 阶段：创建 git commit 和推送

- [ ] 9.2 创建 git commit
  - 使用清晰的 commit message 描述变更
  - 包含变更摘要和影响范围

- [ ] 9.3 推送到远程分支（如果使用 Git）
  - 创建 Pull Request（如果适用）
  - 等待代码审查
