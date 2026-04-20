## Why

当前系统在主密钥丢失或损坏时存在两个严重体验问题：（1）keyring 损坏导致 FatalErrorScreen 只提供"刷新页面"按钮，用户陷入死循环；（2）密钥静默丢失时自动生成新密钥，旧加密数据（API Key）悄然失效，用户毫无察觉。此外，规范中要求的密钥导出/导入功能仅有后端函数，缺少 UI 接入和完整的恢复流程。

## What Changes

- `FatalErrorScreen` 新增"重置所有数据并重新开始"按钮，提供逃生通道，打破死循环
- 新建 `resetAllData()` 函数，覆盖 Tauri 和 Web 两种环境的全量数据清除（安全基础设施 + 业务数据，保留应用配置）
- `initializeMasterKey()` 返回值改造，增加 `isNewlyGenerated` 标记，使调用方能区分"已有密钥"和"新生成密钥"
- 初始化完成后，若检测到密钥为新生成，弹出通知告知用户旧 API Key 已失效
- 新增 `importMasterKey()` 函数，支持用户通过备份密钥恢复加密数据
- 将已有的 `exportMasterKey()` 接入设置页面 UI，支持预防性备份
- 设置页面新增数据重置入口，复用 `resetAllData()`

## Capabilities

### New Capabilities
- `data-reset`: 全量数据重置功能——清除 keyring、业务数据（模型配置、聊天记录），保留应用偏好配置，生成新主密钥并重新初始化
- `master-key-import`: 主密钥导入功能——用户输入备份密钥后替换当前密钥，重新加载模型数据以恢复加密的 API Key

### Modified Capabilities
- `app-master-key`: 新增密钥重新生成检测（`isNewlyGenerated` 返回值），初始化完成后向用户显示密钥变更通知

## Impact

- **核心文件变更**: `src/store/keyring/masterKey.ts`（返回值改造）、`src/components/FatalErrorScreen/index.tsx`（新增重置按钮）、`src/config/initSteps.ts`（传递 isNewlyGenerated 标记）
- **新增文件**: `src/utils/resetAllData.ts`（重置逻辑）
- **类型变更**: `InitResult` 新增 `masterKeyRegenerated?: boolean` 字段，`initializeMasterKey()` 返回值从 `string` 改为结构化对象
- **设置页面**: 新增"密钥管理"或"数据管理"区块（导入、导出、重置）
- **国际化**: 新增所有通知、按钮、确认对话框的翻译 key
- **现有 spec**: `app-master-key` 中已声明导出/导入/重新生成警告的需求，本变更将部分已声明但未实现的能力落地
