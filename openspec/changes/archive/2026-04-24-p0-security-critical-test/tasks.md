## 1. KeyManagementSetting 补充测试

- [x] 1.1 补充导出成功后点击取消关闭对话框用例
- [x] 1.2 补充复制失败后对话框保持打开用例
- [x] 1.3 补充导出加载中按钮状态用例
- [x] 1.4 补充重置完整集成流程用例（确认 → resetAllData → window.location.reload）

## 2. useResetDataDialog 补充测试

- [x] 2.1 补充成功重置后 window.location.reload 调用验证用例
- [x] 2.2 补充失败时 window.location.reload 不被调用验证用例
- [x] 2.3 补充并发双击防护用例（通过 isResetting 状态锁定验证：第一次确认后 isResetting=true，UI 层按钮 disabled 阻止重复点击）
- [x] 2.4 补充确认按钮 destructive 样式验证用例

## 3. 验证

- [x] 3.1 运行全部测试确保无回归
- [x] 3.2 确认安全关键路径覆盖率达标（目标 90%+）
