## 1. crypto-storage — 重新分类为单元测试

- [x] 1.1 将 `src/__test__/integration/crypto-storage.integration.test.ts` 移动到 `src/__test__/utils/crypto-storage.test.ts`（使用 git mv 保留历史）
- [x] 1.2 更新文件内部的 describe 名称（移除"集成测试"字样）
- [x] 1.3 运行移动后的测试确认通过

## 2. toast-e2e — 删除

- [x] 2.1 删除 `src/__test__/integration/toast-e2e.integration.test.tsx`（该文件为 spy 循环论证，与 toast-system 高度重复）

## 3. toast-system — 重写为真正的集成测试

- [x] 3.1 mock `sonner` 模块：将 `toast.success/error/warning/info/loading` 改为 DOM 渲染函数，查找 `data-testid="toast-container"` 容器并追加 `<div data-testid="toast-message">消息文本</div>`
- [x] 3.2 mock `@/components/ui/sonner` 的 Toaster 组件：渲染 `<div data-testid="toast-container"></div>` 作为消息挂载容器（不解除 mock，因 Toaster 依赖 next-themes）
- [x] 3.3 重写测试断言：使用 `screen.findByText('消息文本')` 验证 Toast 消息出现在 DOM 中，替代 `vi.spyOn(toastQueue, 'success')` 的 spy 验证
- [x] 3.4 移除与 toast-e2e 重复的测试用例，保留独特的测试场景（初始化缓存、语言切换 Redux 集成、快速连续调用、组件卸载稳定性）
- [x] 3.5 运行重写后的测试确认通过

## 4. model-config — 降低 mock 粒度

- [x] 4.1 解除 `modelStorage` 的 mock，改用真实存储实现
- [x] 4.2 保留 keyring 的 mock（系统密钥链为外部依赖）
- [x] 4.3 删除不属于集成测试的纯单元测试用例（URL 格式验证、加密算法跨平台一致、mock 环境性能测试等）
- [x] 4.4 更新保存/加载测试：通过 `saveModelsToJson` 写入、`loadModelsFromJson` 读回验证
- [x] 4.5 运行修改后的测试确认通过

## 5. 验证

- [x] 5.1 运行 `pnpm test:integration:run` 确认集成测试通过
- [x] 5.2 运行 `pnpm test:run` 确认全部测试通过
- [x] 5.3 运行 `pnpm tsc` 确认无类型错误
- [x] 5.4 确认 `src/__test__/integration/` 目录中所有文件符合准入标准
