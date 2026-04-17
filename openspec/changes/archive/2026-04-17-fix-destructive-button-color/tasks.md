## 1. 主题变量补充

- [x] 1.1 在 `src/main.css` 的 `@theme inline` 块中添加 `--color-destructive-foreground: var(--destructive-foreground)` 映射
- [x] 1.2 在 `:root` 块中添加 `--destructive-foreground: oklch(0.985 0 0)`
- [x] 1.3 在 `.dark` 块中添加 `--destructive-foreground: oklch(0.985 0 0)`

## 2. 验证

- [x] 2.1 确认 KeyManagementSetting 页面的"重置所有数据"按钮渲染为红底白字
- [x] 2.2 确认 AlertDialog 的确认按钮（`bg-destructive text-destructive-foreground`）正确显示白字
- [x] 2.3 确认暗色模式下同样为红底白字
