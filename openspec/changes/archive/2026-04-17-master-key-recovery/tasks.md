## 1. 基础能力：resetAllData 函数

- [x] 1.1 新建 `src/utils/resetAllData.ts`，实现 `resetAllData()` 函数，覆盖 Web 环境（清除 localStorage keyring 相关项 + 删除 IndexedDB 数据库 + keyring.resetState()）和 Tauri 环境（deletePassword + Store API 清除 models.json 和 chats.json）
- [x] 1.2 为 `resetAllData()` 编写单元测试，覆盖两个环境的清理逻辑和部分失败场景

## 2. 基础能力：initializeMasterKey 返回值改造

- [x] 2.1 修改 `src/store/keyring/masterKey.ts` 中 `initializeMasterKey()` 返回值从 `Promise<string>` 改为 `Promise<{ key: string; isNewlyGenerated: boolean }>`
- [x] 2.2 修改 `src/config/initSteps.ts` 中 masterKey 步骤的 execute，适配新的返回值结构：将 `result.isNewlyGenerated` 存入 `context.setResult('masterKeyRegenerated', ...)`，**必须返回 `result.key`（字符串）**，避免 `InitializationManager` 的 `context.setResult(step.name, value)` 将 context 中的 `masterKey` 覆写为对象类型
- [x] 2.3 修改 `src/services/initialization/types.ts` 中 `InitResult` 接口，新增 `masterKeyRegenerated?: boolean` 字段
- [x] 2.4 修改 `src/services/initialization/InitializationManager.ts`，在构建 `InitResult` 时从 context 提取 `masterKeyRegenerated` 字段（参考已有的 `modelProviderStatus` 提取模式）
- [x] 2.5 检查所有直接调用 `initializeMasterKey()` 的地方（如测试文件）并适配新返回值

## 3. 基础能力：importMasterKey 函数

- [x] 3.1 在 `src/store/keyring/masterKey.ts` 中新增 `importMasterKey(key: string)` 函数：验证 hex 格式（64 字符）→ 存储到 keyring → 重新加载模型数据验证
- [x] 3.2 为 `importMasterKey()` 编写单元测试，覆盖格式验证、导入成功、导入后解密失败等场景

## 4. UI：FatalErrorScreen 重置按钮

- [x] 4.1 修改 `src/components/FatalErrorScreen/index.tsx`，新增"重置所有数据并重新开始"按钮
- [x] 4.2 实现确认对话框组件（AlertDialog），展示重置后果说明，提供"确认重置"和"取消"选项
- [x] 4.3 确认后调用 `resetAllData()` 并 `window.location.reload()`
- [x] 4.4 新增 FatalErrorScreen 相关的 i18n 翻译 key（中英文）

## 5. UI：密钥重新生成通知

- [x] 5.1 在 `MainApp.tsx`（或初始化结果处理逻辑中）检测 `InitResult.masterKeyRegenerated` 标记
- [x] 5.2 当 `masterKeyRegenerated` 为 true 时，从**持久化存储**（非 Redux 状态）中检查是否存在 `enc:` 前缀的加密数据；仅在存在加密数据时使用 toast 通知用户密钥已重新生成，旧 API Key 已失效（首次使用不通知）。通知内容需包含警告：在导入备份密钥前请勿修改模型配置，否则加密数据将无法恢复
- [x] 5.3 通知提供"导入密钥"操作按钮（视觉优先级高于关闭按钮），跳转到设置页面的密钥管理区域
- [x] 5.4 新增通知相关的 i18n 翻译 key（中英文）

## 6. UI：设置页面密钥管理入口

- [x] 6.1 在设置页面新增"密钥管理"或"数据管理"区块
- [x] 6.2 实现"导出密钥"功能：调用 `exportMasterKey()`，显示安全警告后复制到剪贴板
- [x] 6.3 实现"导入密钥"功能：输入框 + 确认按钮，调用 `importMasterKey()`
- [x] 6.4 实现"重置所有数据"功能：复用确认对话框，调用 `resetAllData()`
- [x] 6.5 新增设置页面密钥管理区域的 i18n 翻译 key（中英文）

## 7. 集成测试

- [x] 7.1 编写 FatalErrorScreen 重置按钮的集成测试（渲染 → 点击 → 确认 → 验证 resetAllData 调用）
- [x] 7.2 编写密钥重新生成通知的集成测试（模拟 isNewlyGenerated → 验证 toast 显示）
- [x] 7.3 编写密钥导入导出的集成测试（导出 → 导入 → 验证数据恢复）
