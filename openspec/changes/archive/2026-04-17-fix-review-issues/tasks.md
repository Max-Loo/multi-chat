## 1. 存储常量统一导出

- [x] 1.1 从 `src/utils/tauriCompat/keyring.ts` 导出 `SEED_STORAGE_KEY` 常量（将 `const` 改为 `export const`）
- [x] 1.2 从 `src/utils/tauriCompat/keyringMigration.ts` 导出 `KEYRING_DB_NAME` 和 `STORE_DB_NAME` 常量（将 `const` 改为 `export const`）
- [x] 1.3 更新 `src/utils/resetAllData.ts`：移除硬编码字符串，改为从 keyring.ts 和 keyringMigration.ts 导入常量

## 2. 抽取 useResetDataDialog Hook

- [x] 2.1 创建 `src/hooks/useResetDataDialog.ts`，封装 `isDialogOpen`、`isResetting` 状态和 `handleConfirmReset` 逻辑，catch 块中包含 `console.error`
- [x] 2.2 重构 `src/components/FatalErrorScreen/index.tsx`：使用 `useResetDataDialog` Hook 替换内联的重置逻辑
- [x] 2.3 重构 `src/pages/Setting/components/KeyManagementSetting/index.tsx`：使用 `useResetDataDialog` Hook 替换内联的重置逻辑

## 3. 修复 useEffect 竞态条件

- [x] 3.1 修改 `src/MainApp.tsx` 密钥重新生成通知的 useEffect：将 `notifiedRef.current = true` 提前到异步调用之前作为同步守卫
- [x] 3.2 将该 useEffect 的依赖数组从 `[t]` 改为 `[]`

## 4. hasEncryptedDataInStorage 职责迁移

- [x] 4.1 在 `src/store/storage/modelStorage.ts` 中新增 `hasEncryptedModels()` 函数，复用已有的 `loadFromStore` + store 单例
- [x] 4.2 从 `src/store/keyring/masterKey.ts` 中移除 `hasEncryptedDataInStorage` 函数及其相关 import（`createLazyStore`、`Model` 类型）
- [x] 4.3 更新 `src/MainApp.tsx` 的导入，从 `modelStorage` 引入 `hasEncryptedModels` 替代原函数

## 5. 简化导入密钥流程

- [x] 5.1 重构 `src/pages/Setting/components/KeyManagementSetting/index.tsx` 的 `handleImportKey`：移除 `initializeModels()` 调用和恢复统计逻辑，导入成功后直接显示 toast 并 `window.location.reload()`
- [x] 5.2 移除 `store`、`initializeModels`、`Model` 类型的 import（如不再需要）

## 6. 更新测试

- [x] 6.1 更新 `src/__test__/integration/master-key-recovery.integration.test.tsx`：适配 `useResetDataDialog` Hook 和导入流程变更
- [x] 6.2 更新 `src/__test__/store/keyring/masterKey.test.ts`：移除 `hasEncryptedDataInStorage` 相关测试（如有），适配函数迁移
