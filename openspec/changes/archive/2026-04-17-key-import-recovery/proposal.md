## Why

当前密钥导入入口位于设置页面，但能进入设置页面说明应用已正常运行，此时导入密钥属于多此一举。真正需要导入的场景是密钥出错时的恢复（如 Web 端 seed 丢失导致 FatalErrorScreen、Tauri 端钥匙串清除后密钥重新生成），这些场景下用户被困在错误状态中或数据静默丢失，却没有得到充分的恢复引导。此外，当前导入流程不验证密钥是否能解密现有数据，用户可能导入错误密钥而不自知。

## What Changes

- 移除设置页面 `KeyManagementSetting` 中的密钥导入 UI（输入框和导入按钮），仅保留导出和重置功能
- 在 `FatalErrorScreen` 中增加密钥导入入口（含密钥验证），覆盖 Web 端 seed 丢失等可恢复的 fatal 错误场景
- 将 `MainApp.tsx` 中密钥重新生成 Toast 的"导入密钥"按钮从导航到设置页改为打开独立的恢复对话框（含密钥验证）
- 新增密钥验证机制：导入密钥后，在 reload 前尝试解密 Store 中的加密数据来验证密钥是否匹配，不匹配则提示用户

## Capabilities

### New Capabilities
- `key-import-validation`: 导入密钥时的验证机制——尝试用导入的密钥解密现有加密数据，确认密钥匹配后再接受导入
- `key-recovery-dialog`: 独立的密钥恢复对话框组件，供 FatalErrorScreen 和 Toast 恢复流程共用

### Modified Capabilities
- `app-master-key`: 密钥导入场景从设置页迁移到错误恢复上下文，`importMasterKey` 增加验证步骤

## Impact

- `src/pages/Setting/components/KeyManagementSetting/` — 移除导入相关 UI
- `src/components/FatalErrorScreen/` — 增加导入入口
- `src/MainApp.tsx` — Toast 按钮行为从导航改为打开对话框
- `src/store/keyring/masterKey.ts` — 新增 `importMasterKeyWithValidation` 函数
- `src/store/keyring/keyVerification.ts` — 新增 `verifyMasterKey` 验证函数
- `src/services/initialization/types.ts` — `InitError` 增加 `stepName` 字段
- `src/locales/` — 新增/修改相关国际化文案
- `src/locales/` — 新增/修改相关国际化文案
