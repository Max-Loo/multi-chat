## 1. 暗色模式色彩调整

- [x] 1.1 调整 `.dark {} 块中背景类变量：`--background` → oklch(0.175)、`--card` / `--popover` / `--sidebar` → oklch(0.230)、`--secondary` / `--muted` / `--accent` / `--sidebar-accent` → oklch(0.290)
- [x] 1.2 调整 `.dark {} 块中前景类变量：`--foreground` / `--card-foreground` / `--popover-foreground` / `--secondary-foreground` / `--accent-foreground` / `--sidebar-foreground` / `--sidebar-primary-foreground` / `--sidebar-accent-foreground` → oklch(0.935)
- [x] 1.3 调整 `.dark {} 块中其他变量：`--primary` → oklch(0.880)、`--muted-foreground` → oklch(0.650)、`--border` / `--sidebar-border` → oklch(1 0 0 / 12%)、`--input` → oklch(1 0 0 / 18%)
- [x] 1.4 调整 `.dark {} 块中导航栏 muted 变量：`--nav-chat-muted` / `--nav-model-muted` / `--nav-setting-muted` → oklch(0.25 0.05 <色相>)

## 2. 移除硬编码 dark: 前缀

- [x] 2.1 在 `Title.tsx` 中将 `dark:bg-orange-600` 替换为 CSS 变量方案（新增自定义 CSS 变量或使用现有语义变量）
- [x] 2.2 在 `alert.tsx` 中将 `dark:border-destructive` 替换为 CSS 变量方案（考虑使用 `border-destructive/50` 或自定义变量控制暗色模式边框表现）
- [x] 2.3 全局搜索验证业务代码中无剩余 `dark:` 前缀硬编码

## 3. 验证

- [ ] 3.1 在浅色模式下视觉验证无变化
- [ ] 3.2 在暗色模式下视觉验证对比度舒适、层级区分清晰、导航栏色彩协调
- [x] 3.3 运行 `pnpm tsc` 确保无类型错误
- [x] 3.4 运行 `pnpm lint` 确保无 lint 错误
