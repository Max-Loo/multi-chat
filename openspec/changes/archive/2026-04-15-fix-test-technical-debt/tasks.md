## 1. 删除 Router 占位测试

- [x] 2.1 删除 `routeParams.test.ts` 中 7 个 `expect(true).toBe(true)` 占位测试用例
- [x] 2.2 删除 `routerIntegration.test.ts` 中 1 个占位测试用例
- [x] 2.3 删除 `navigationGuards.test.ts` 中 1 个占位测试用例
- [x] 2.4 检查删除后是否有空的 `describe` 块需要一并清理

## 2. 删除其他占位测试

- [x] 3.1 删除 `isolation.test.ts` 中 1 个占位测试用例
- [x] 3.2 删除 `settings-change.integration.test.ts` 中 1 个占位测试用例

## 3. 重写 masterKey 安全警告测试

- [x] 4.1 将 `masterKey.test.ts` 中 3 个 `expect(true).toBe(true)` 替换为验证 `toastQueue.warning` 调用的行为断言
- [x] 4.2 确保每个安全警告测试验证实际的 `toastQueue.warning` 调用（Web 环境应调用，Tauri/已 dismissed 不应调用）

## 4. 验证

- [x] 4.1 执行完整测试套件，确认 0 failed、测试数量减少约 14 个
- [x] 4.2 确认无 `expect(true).toBe(true)` 残留（全局搜索验证）
