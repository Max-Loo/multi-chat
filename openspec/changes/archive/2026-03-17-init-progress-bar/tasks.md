## 1. 依赖和组件准备

- [x] 1.1 安装 @radix-ui/react-progress 依赖
- [x] 1.2 创建 src/components/ui/progress.tsx（shadcn/ui Progress 组件）

## 2. InitializationController 组件实现

> **职责**：执行初始化、更新进度、返回初始化结果。不处理 Toast、安全警告等副作用。

- [x] 2.1 创建 src/components/InitializationController/index.tsx
- [x] 2.2 实现初始化状态管理（status, currentStep, totalSteps, fatalErrors, warnings, readyToProceed）
- [x] 2.3 实现进度初始值设为 0（确保进度条从 0% 开始）
- [x] 2.4 实现动态三个点动画（setInterval，每 500ms 更新）
- [x] 2.5 实现完成后 500ms 延迟逻辑
- [x] 2.6 实现 onProgress 回调更新进度
- [x] 2.7 实现 onComplete 回调通知父组件（传递 success, fatalErrors, warnings）
- [x] 2.8 实现进度条 UI（Progress + 百分比显示在右侧）
- [x] 2.9 实现错误状态渲染（FatalErrorScreen / NoProvidersAvailable）

## 3. main.tsx 重构

> **职责**：管理应用状态、处理副作用（Toast、安全警告、静默刷新）。

- [x] 3.1 创建 App 组件管理初始化状态（'initializing' | 'ready'）
- [x] 3.2 App 组件渲染 InitializationController，接收 onComplete 回调
- [x] 3.3 根据初始化结果处理警告 Toast 显示逻辑
- [x] 3.4 根据初始化结果处理安全警告逻辑（handleSecurityWarning）
- [x] 3.5 根据初始化结果处理静默刷新逻辑（triggerSilentRefreshIfNeeded）
- [x] 3.6 初始化完成后渲染主应用（Provider + RouterProvider）

## 4. 清理

- [x] 4.1 删除 src/components/InitializationScreen/index.tsx
- [x] 4.2 更新相关导入（如有）

## 5. 测试

- [x] 5.1 创建 InitializationController 单元测试
  - 测试进度从 0% 开始
  - 测试 onProgress 回调更新进度
  - 测试动态三个点动画
  - 测试完成后 500ms 延迟
  - 测试 onComplete 回调被正确调用
  - 测试错误状态渲染
- [x] 5.2 运行现有测试确保无回归
- [x] 5.3 手动测试正常初始化流程
- [x] 5.4 手动测试错误处理流程（模拟关键步骤失败）
