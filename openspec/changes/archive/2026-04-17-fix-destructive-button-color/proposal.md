## Why

当前 `main.css` 主题配置中缺少 `--destructive-foreground` CSS 变量定义，导致所有使用 `variant="destructive"` 的 Button 组件渲染为红底黑字，可读性差且不符合设计规范。

## What Changes

- 在 `main.css` 的 `:root` 和 `.dark` 两个主题块中补充 `--destructive-foreground` 变量定义（白色）
- 在 `@theme inline` 块中补充 `--color-destructive-foreground` 到 `--destructive-foreground` 的映射

## Capabilities

### New Capabilities

- `destructive-button-theme`: 补充 destructive 按钮 foreground 颜色变量，确保红底白字的正确渲染

### Modified Capabilities

（无）

## Impact

- **文件**: `src/main.css`（主题配置文件，加 3 行变量定义）
- **影响范围**: 所有使用 `variant="destructive"` 的 Button 和 AlertDialog 组件自动生效，无需修改任何组件代码
- **兼容性**: 纯 CSS 变量补充，无破坏性变更
