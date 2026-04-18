## Context

代码审查发现 `feat/master-key` 分支中存在 3 项 P0 运行时危害和 6 项 P1/P2 代码质量问题。涉及文件包括 `MainApp.tsx`、`keyVerification.ts`、`resetAllData.ts`、`initSteps.ts`、`InitializationManager.ts`、`KeyManagementSetting/index.tsx`、`FatalErrorScreen/index.tsx`、`masterKey.ts`。所有问题均为内部实现修复，无外部 API 变更。

## Goals / Non-Goals

**Goals:**
- 修复 3 项 P0 资源泄漏和死代码路径问题，确保运行时稳定性
- 消除 3 项 P1 状态冗余和硬编码耦合风险
- 提升 3 项 P2 代码质量（DRY、结构简化、常量提取）

**Non-Goals:**
- 不新增功能或修改用户可见行为（E1 修复除外——恢复提示从"不触发"变为"正确触发"）
- 不重构初始化流程的整体架构
- 不处理 P3 级别的细微改进（R3 destructive className 重复、Q3 注释冗余、E4 useEffect 依赖）

## Decisions

### D1. E1: 在 decryptionFailureCount > 0 分支中直接展示恢复提示

**选择**: 将 `hasEncryptedModels()` 调用移到 `decryptionFailureCount > 0` 分支内，解密失败时直接附带恢复操作按钮。

**替代方案**: 在 `InitResult` 中增加 `hasEncryptedModels` 字段（初始化时计算一次）。这需要修改 `InitializationManager`、`initSteps.ts` 和 `InitResult` 类型，改动范围更大。

**理由**: 当前 `decryptionFailureCount > 0` 本身就意味着存在加密数据且解密失败，等同于 `hasEncryptedModels` 为 true。在解密失败通知中附带恢复按钮即可，无需额外查询。移除 `hasEncryptedModels` 的 import 和死代码分支。

### D2. E2: verifyMasterKey 完成后关闭 store

**选择**: 在 `verifyMasterKey` 函数末尾使用 try/finally 确保 store 关闭。

**替代方案**: 复用 `modelStorage.ts` 的 `getModelsStore()` 单例。但该单例为模块级变量，在验证场景下读取不应影响其状态，且复用增加了 `keyVerification.ts` 对 `modelStorage.ts` 的耦合。

**理由**: 验证是一次性操作，独立的 store 实例 + 用后关闭更安全，避免长期持有连接。保留 `resetVerificationStore` 用于测试场景的清理。

### D3. E3: clearTauriStore 中添加 store.close()

**选择**: 在 `store.save()` 后调用 `await store.close()`。

**理由**: 直接修复，`createLazyStore` 返回的对象支持 `close()`，调用后释放文件句柄。

### D4. Q1: 移除 isFetchingKey 状态

**选择**: 删除 `isFetchingKey` state，所有使用处替换为 `exportState === ""`。

**理由**: `exportState` 的三态（`null`/`""`/`string`）已完整编码了 fetching 状态，`isFetchingKey` 是冗余派生。

### D5. Q2+Q5: InitializationManager 自动注入 stepName

**选择**: `InitializationManager` 在调用 `step.onError(error)` 后，自动设置 `initError.stepName = step.name`。各步骤的 `onError` 回调移除 `stepName` 字段。`FatalErrorScreen` 中 `error.stepName === 'masterKey'` 改为从 `initSteps.ts` 导出的常量 `MASTER_KEY_STEP_NAME`。

**替代方案**: 仅导出常量不改 Manager（只解决 Q2）。但 Q5 的自动注入更彻底，且 `stepName` 与 `step.name` 一一对应是合理的默认行为。

**理由**: 自动注入消除了 9 处手动 `stepName` 的维护负担，常量导出解决了 `FatalErrorScreen` 中的硬编码问题。

### D6. R1: 将 AlertDialog JSX 放入 useResetDataDialog hook 返回

**选择**: 在 `useResetDataDialog` hook 中返回一个渲染函数 `renderResetDialog()`，返回完整的 AlertDialog JSX。

**替代方案**: 创建独立的 `ResetConfirmDialog` 组件。但 hook 已经持有所有状态，渲染函数更内聚。

**理由**: 两处消费点（`KeyManagementSetting`、`FatalErrorScreen`）都使用 `useResetDataDialog` hook，直接从 hook 获取 JSX 是最自然的共享方式，无需额外 import 组件。

### D7. Q4: 移除 items-center 和内层 w-full div

**选择**: 在 `KeyManagementSetting` 中，移除外层容器的 `items-center` 和内层 `<div className="w-full">` 包裹，直接将卡片 div 作为外层的子元素。

**理由**: 当前内层 `w-full` 的唯一作用是对抗外层的 `items-center`，两者同时移除是更清晰的方案。

### D8. R2: 提取 SECURITY_WARNING_DISMISSED_KEY 常量

**选择**: 在 `masterKey.ts` 中导出 `SECURITY_WARNING_DISMISSED_KEY` 常量，`resetAllData.ts` 导入该常量替代硬编码字符串。

**理由**: 与同文件中已有的 `KEYRING_SERVICE_NAME`、`KEYRING_ACCOUNT_NAME` 等命名常量保持一致。

## Risks / Trade-offs

- **E1 移除 hasEncryptedModels 调用** → 缺少对非加密场景的过滤。缓解：`decryptionFailureCount > 0` 本身隐含存在加密数据，不需要额外检查。
- **D5 自动注入 stepName** → 如果 `onError` 返回的对象被冻结（Object.freeze），赋值会静默失败。缓解：`onError` 返回的是新建的普通对象，不会被冻结。
- **D6 hook 返回 JSX** → 组件库（AlertDialog）的 import 分散到 hook 文件中。缓解：hook 本身已 import `resetAllData`，增加 UI import 是合理的内聚。
