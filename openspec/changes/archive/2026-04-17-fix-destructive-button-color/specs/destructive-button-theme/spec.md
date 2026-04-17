## ADDED Requirements

### Requirement: Destructive 按钮前景色变量定义
`main.css` SHALL 在 `:root` 和 `.dark` 两个主题块中定义 `--destructive-foreground` CSS 变量，值为 `oklch(0.985 0 0)`（白色）。

#### Scenario: 亮色模式下 destructive 按钮前景色为白色
- **WHEN** 应用处于亮色模式（默认）
- **THEN** 使用 `variant="destructive"` 的 Button 组件的文字颜色 SHALL 为白色

#### Scenario: 暗色模式下 destructive 按钮前景色为白色
- **WHEN** 应用处于暗色模式（`.dark` 类生效）
- **THEN** 使用 `variant="destructive"` 的 Button 组件的文字颜色 SHALL 为白色

### Requirement: Destructive foreground 主题映射
`main.css` SHALL 在 `@theme inline` 块中添加 `--color-destructive-foreground: var(--destructive-foreground)` 映射，使 Tailwind 的 `text-destructive-foreground` 工具类可用。

#### Scenario: Tailwind 工具类正确解析
- **WHEN** 组件使用 `text-destructive-foreground` 类名
- **THEN** 该类名 SHALL 解析为 `--destructive-foreground` 变量定义的颜色值
