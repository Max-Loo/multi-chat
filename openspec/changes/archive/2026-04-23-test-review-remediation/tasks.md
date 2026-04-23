## 1. P0 安全关键路径测试

- [x] 1.1 创建 `useResetDataDialog` hook 测试文件：`src/__test__/hooks/useResetDataDialog.test.tsx`
- [x] 1.2 测试初始状态（isDialogOpen=false, isResetting=false）
- [x] 1.3 测试打开/关闭对话框（setIsDialogOpen 切换）
- [x] 1.4 测试确认重置成功流程（调用 resetAllData、isResetting 状态变化）
- [x] 1.5 测试确认重置失败流程（resetAllData reject 后状态恢复）
- [x] 1.6 测试重置中按钮禁用状态
- [x] 1.7 创建 `KeyManagementSetting` 组件测试文件：`src/__test__/pages/Setting/components/KeyManagementSetting/index.test.tsx`
- [x] 1.8 测试密钥导出成功流程（exportMasterKey 成功、显示密钥内容）
- [x] 1.9 测试密钥导出失败流程（exportMasterKey reject、显示错误 toast）
- [x] 1.10 测试密钥复制成功流程（copyToClipboard 成功、成功 toast、关闭对话框）
- [x] 1.11 测试密钥复制失败流程（copyToClipboard reject、错误 toast）
- [x] 1.12 测试数据重置对话框集成（useResetDataDialog 交互）

## 2. P1 CSS 类选择器迁移

> 注：前一轮变更已完成 RunningChatBubble.test.tsx（原 17 处）和 ChatPanelContentDetail.test.tsx（原 6 处）的迁移，当前剩余 21 个文件共 70 处。

- [x] 2.1 为需要 data-testid 的组件添加属性（ChatPanel、ChatBubble、NoProvidersAvailable、Splitter 等 10-15 个组件）
- [x] 2.2 迁移 ChatPanel.test.tsx 中的 CSS 选择器（11 处）
- [x] 2.3 迁移 NoProvidersAvailable.test.tsx 中的 CSS 选择器（5 处）
- [x] 2.4 迁移 DetailScroll.test.tsx 中的 CSS 选择器（6 处）
- [x] 2.5 迁移 ChatButton.test.tsx 中的 CSS 选择器（6 处）
- [x] 2.6 迁移 ToolsBar.test.tsx 中的 CSS 选择器（3 处）
- [x] 2.7 迁移剩余 15 个文件中的 CSS 选择器（共约 39 处）：PanelSkeleton（6）、ProviderCard（4）、ChatSidebar（4）、ModelTable（4）、ThinkingSection（3）、Splitter（2）、ModelSearch（2）、ModelConfigForm（2）、CreateModel（2）、ModelProviderDisplay（2）、PageSkeleton（3）、MobileDrawer（1）、Sidebar（1）、SettingPage（1）

## 3. P1 条件守卫静默跳过修复

> 注：共 8 个文件 34 处条件守卫。以下按文件逐一列出精确行号。

- [x] 3.1 修复 ChatPanel.test.tsx 中 5 处条件守卫（L127、L245、L266、L288、L314）：改为 getByRole('switch') + 前置断言
- [x] 3.2 修复 ChatPanelHeader.test.tsx 中 1 处条件守卫（L94）：改为 getByRole + 前置断言
- [x] 3.3 修复 EditModelModal.test.tsx 中 3 处条件守卫（L128、L158、L232）
- [x] 3.4 修复 ToolsBar.test.tsx 中 13 处条件守卫：优先使用 getByRole('button', { name: ... })
- [x] 3.5 修复 ModelConfigForm.test.tsx 中 5 处条件守卫（L106、L133、L173、L179、L207）
- [x] 3.6 修复 ChatButton.test.tsx 中 4 处条件守卫（L160、L171、L207、L453）
- [x] 3.7 修复 CreateModel.test.tsx 中 1 处条件守卫（L197）
- [x] 3.8 修复 ModelSidebar.test.tsx 中 2 处条件守卫（L203、L224）

## 4. P1 跳过用例处理

- [x] 4.1 修复 chatMiddleware.test.ts #170：构造完整 runningChat state，启用测试
- [x] 4.2 实现 ChatPanelSender.test.tsx #428 (todo)：发送失败时保持输入框内容
- [x] 4.3 为 ChatPanelSender.test.tsx #353 补充详细 skip 注释（功能被 hidden 禁用）
- [x] 4.4 为 crypto-masterkey.integration.test.ts #332 补充详细 skip 注释（fake-indexedDB mock 死锁）
- [x] 4.5 为 keyring.test.ts #761 #765 补充详细 skip 注释（Web Crypto API mock 不可靠）
- [x] 4.6 为 keyringMigration.test.ts #438 #443 补充详细 skip 注释（模块缓存隔离问题）

## 5. P1 XSS 测试使用真实库

- [x] 5.1 移除 ChatBubble.test.tsx 中 markdown-it 的 vi.mock
- [x] 5.2 移除 ChatBubble.test.tsx 中 DOMPurify 的 vi.mock
- [x] 5.3 调整 XSS 安全测试用例（L257-283）使用真实 markdown-it + DOMPurify
- [x] 5.4 重写 Markdown 渲染断言：mock 的 markdown-it 对所有输入返回 `<p>${str}</p>`，保留了原始 Markdown 语法；真实 markdown-it 会渲染为 HTML 标签，`textContent` 完全不同。以下测试必定失败需重写断言：
  - L68「应该渲染包含 Markdown 的用户消息」：`toContain('**Bold**')` → 改为检查渲染后的 HTML 结构（如 `getByRole('strong')`）
  - L115「应该渲染包含 Markdown 的助手消息」：`toContain('# Heading')` → 改为检查 `<h1>` 等渲染结果
- [x] 5.5 排查其余非 XSS 用例（20 个中的 18 个）：验证纯文本和特殊字符等用例在真实渲染下断言是否仍通过，如有差异则调整
- [x] 5.6 运行 ChatBubble.test.tsx 全量测试确认通过
