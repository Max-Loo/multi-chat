## 1. 剪贴板工具函数

- [x] 1.1 新建 `src/utils/clipboard.ts`，实现 `copyToClipboard(text: string): Promise<void>` 函数，优先使用 `navigator.clipboard.writeText()`，失败时回退到 `document.execCommand('copy')`（临时 textarea 方案）
- [x] 1.2 为 `copyToClipboard` 编写单元测试，覆盖 Clipboard API 成功、fallback 成功、两者均失败三种场景

## 2. 集成到密钥导出

- [x] 2.1 修改 `src/pages/Setting/components/KeyManagementSetting/index.tsx`，将 `navigator.clipboard.writeText(key)` 替换为 `copyToClipboard(key)`
- [x] 2.2 更新 `src/@types/translationResources.d.ts` 中剪贴板相关的类型定义（如有新增翻译 key）
