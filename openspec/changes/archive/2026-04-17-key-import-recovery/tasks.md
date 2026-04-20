## 1. 密钥验证逻辑

- [x] 1.1 新建 `src/store/keyring/keyVerification.ts` 模块，实现 `verifyMasterKey(key: string): Promise<boolean | null>` 函数：使用 `loadFromStore` 读取 Store 中的模型数据，找到第一个 `enc:` 前缀的 apiKey，尝试 `decryptField` 解密，成功返回 true，失败返回 false，无加密数据返回 null
- [x] 1.2 在 `src/store/keyring/masterKey.ts` 中新增 `importMasterKeyWithValidation` 函数：格式验证 → 验证匹配性（调用 `verifyMasterKey`）→ 存储密钥 → 返回 `{ success, keyMatched, error? }`

## 2. KeyRecoveryDialog 共享组件

- [x] 2.1 创建 `src/components/KeyRecoveryDialog/index.tsx`：包含密钥输入框、安全警告提示、导入按钮（空输入时禁用）、加载状态
- [x] 2.2 实现导入流程：调用 `importMasterKeyWithValidation`，根据返回结果（匹配/不匹配/格式错误/存储失败）显示对应 UI 状态
- [x] 2.3 实现验证不匹配时的二次确认：显示警告"密钥无法解密现有数据"，提供"仍然导入"和"取消"选项
- [x] 2.4 添加国际化文案到 `src/locales/` 三个语言文件（zh/en/fr）

## 3. FatalErrorScreen 集成

- [x] 3.1 修改 `src/components/FatalErrorScreen/index.tsx`：检测 fatal 错误是否来自 masterKey 步骤（通过 `error.stepName === 'masterKey'` 判断）
- [x] 3.2 在 masterKey fatal 错误时显示"导入密钥"按钮，点击打开 KeyRecoveryDialog
- [x] 3.3 导入成功后自动 `window.location.reload()`

## 4. MainApp Toast 恢复流程改造

- [x] 4.1 修改 `src/MainApp.tsx`：将 Toast "导入密钥"按钮的 `onClick` 从 `router.navigate("/setting/key-management")` 改为控制 KeyRecoveryDialog 对话框显示
- [x] 4.2 在 MainApp 中引入 KeyRecoveryDialog 组件，通过状态控制显示/隐藏
- [x] 4.3 对话框中导入成功后自动 `window.location.reload()`

## 5. 移除设置页面导入 UI

- [x] 5.1 从 `src/pages/Setting/components/KeyManagementSetting/index.tsx` 中移除密钥导入相关的 state（`importKeyInput`、`isImporting`）和处理函数（`handleImportKey`）
- [x] 5.2 移除导入相关的 JSX 区块（输入框、导入按钮）
- [x] 5.3 移除 `InvalidKeyFormatError` 和 `importMasterKey` 的导入（如果不再被使用）
- [x] 5.4 清理 i18n 中仅用于设置页导入的文案（如有独立于 KeyRecoveryDialog 的文案）

## 6. 测试

- [x] 6.1 为 `verifyMasterKey`（`keyVerification.ts`）编写单元测试：有加密数据且匹配、有加密数据不匹配、无加密数据
- [x] 6.2 为 `importMasterKeyWithValidation` 编写单元测试：验证通过、验证失败（keyMatched=false）、无加密数据跳过验证、格式错误、存储失败
- [x] 6.3 为 KeyRecoveryDialog 编写组件测试：渲染、输入、导入流程、验证失败二次确认
- [x] 6.4 为 FatalErrorScreen 编写集成测试：masterKey 错误时显示导入按钮、非 masterKey 错误时不显示
