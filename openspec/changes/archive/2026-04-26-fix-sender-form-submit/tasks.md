## 1. 修复

- [x] 1.1 在 `src/pages/Chat/components/Panel/Sender.tsx` 的 `<form>` 元素上添加 `onSubmit={(e) => e.preventDefault()}`

## 2. 验证

- [x] 2.1 确认修改后 `pnpm tsc` 类型检查通过
- [x] 2.2 确认相关测试通过
