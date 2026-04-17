## Context

master-key-recovery 分支已完成主密钥恢复功能的实现，但 simplify 审查发现 7 个 P0/P1 级别问题。这些问题涉及运行时 Bug（React Strict Mode 竞态）、误导用户反馈（失败显示成功、重置无反馈）和代码重复隐患。本变更不引入新功能，仅修复已有实现的问题。

## Goals / Non-Goals

**Goals:**

- 修复 useEffect 竞态条件，确保 React Strict Mode 下不重复弹出通知
- 修复导入密钥后模型加载失败时的误导性"成功"提示
- 修复 FatalErrorScreen 重置失败时的静默吞错行为
- 消除 FatalErrorScreen 与 KeyManagementSetting 之间的重置对话框重复代码
- 简化导入密钥后的验证刷新流程
- 修正恢复数量统计的准确性
- 将 `hasEncryptedDataInStorage` 移至正确的模块
- 统一存储常量引用

**Non-Goals:**

- 不重构 KeyManagementSetting 的组件拆分（L2，后续迭代）
- 不优化 clearTauriStore 的逐个删除为 clear()（L1，后续迭代）
- 不修复测试质量问题（L3，与本次修复范围无关）
- 不合并 deleteIndexedDB 重复逻辑（M5，keyringMigration 已标注"计划清理"）

## Decisions

### D1: useEffect 竞态修复策略 — 同步守卫 + 空依赖

**选择**: 将 `notifiedRef.current = true` 提前到异步调用之前，并将依赖数组从 `[t]` 改为 `[]`。

**理由**: `notifiedRef.current = true` 放在 await 之后是竞态根源 — React Strict Mode 双重 effect 调用时，两个 `checkAndNotify` 可同时通过初始检查。提前为同步设置可确保第二次调用被 ref 守护拦截。移除 `[t]` 依赖是因为通知只应显示一次，不应响应语言切换。

**备选方案**: 使用 `AbortController` 取消前一次调用。过度设计，ref 守护已足够。

### D2: 重置逻辑共享方案 — useResetDataDialog Hook

**选择**: 抽取 `useResetDataDialog()` 自定义 Hook，封装 `isDialogOpen`、`isResetting` 状态和 `handleConfirmReset` 逻辑。

**理由**: 两个组件的重置确认流程完全相同（状态声明 + handler + AlertDialog JSX 结构 + i18n keys）。Hook 返回状态和 handler，各组件保留自己的 AlertDialog JSX（FatalErrorScreen 在 Provider 树外，不能使用 `useConfirm` hook）。

**Hook 同时修复 M3**: 在 catch 块中添加 `console.error` 日志记录，满足 design.md 中"记录失败步骤的错误日志"的要求。

### D3: 导入密钥流程简化 — 直接刷新

**选择**: 移除导入后的 `initializeModels()` 验证统计和 `setTimeout` reload，改为直接显示成功 toast 后 `window.location.reload()`。

**理由**: 原实现做了完整的模型加载、解密统计和 toast 展示，但 2 秒后全页刷新丢弃一切。统计数字不可信（M2 — 未区分"未配置 Key"和"解密失败"），失败时仍显示成功（M4）。简化后行为清晰：导入成功 → 提示 → 刷新 → 应用以新密钥重新初始化，模型数据自然呈现解密结果。

**备选方案**: 去掉 reload，用已 dispatch 的数据就地更新 UI。需要处理更多边界情况（模型列表刷新、路由状态等），复杂度不匹配收益。当前桌面应用 reload 体验可接受。

### D4: hasEncryptedDataInStorage 归属调整 — 移至 modelStorage

**选择**: 将 `hasEncryptedDataInStorage` 从 `masterKey.ts` 移到 `modelStorage.ts`，复用已有的 `loadFromStore` + store 单例。

**理由**: 该函数读取模型数据、检查加密状态，是模型存储层的职责。当前实现在 `masterKey.ts` 中新建独立 Store 实例，绕过了 `modelStorage.ts` 的单例管理，违反单一职责原则。移到 `modelStorage.ts` 后复用 `getModelsStore()` 单例，减少重复的 Store 初始化开销。

### D5: 存储常量统一方案 — 导出 + 引用

**选择**: 从 `keyring.ts` 导出 `SEED_STORAGE_KEY`，从 `keyringMigration.ts` 导出 `KEYRING_DB_NAME`/`STORE_DB_NAME`，`resetAllData.ts` 统一引用。

**理由**: 修复 H3（抽取 Hook）时会自然触及 `resetAllData.ts`，顺势统一常量。风险极低，仅改变引用方式。

## Risks / Trade-offs

- [简化导入流程导致丢失即时反馈] → 可接受：刷新后模型列表自然呈现解密结果，用户可直观判断导入是否成功
- [useResetDataDialog Hook 引入 FatalErrorScreen 对 hooks 的依赖] → 低风险：FatalErrorScreen 已使用 useState，Hook 不引入额外 Provider 依赖
- [modelStorage.ts 新增对 isEncrypted 的依赖] → 低风险：`isEncrypted` 是纯工具函数，不引入副作用
