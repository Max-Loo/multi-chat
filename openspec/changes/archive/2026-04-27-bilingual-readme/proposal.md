## Why

项目 README 目前仅有中文版本，不利于国际开发者了解和使用项目。作为开源项目，英文 README 是吸引全球贡献者的基本要求，也符合国际开源社区的惯例。

## What Changes

- **重命名**：将现有 `README.md`（中文）重命名为 `README.zh-CN.md`，并在顶部添加语言切换链接
- **新建**：创建英文版 `README.md`，完整翻译中文版所有内容，顶部添加语言切换链接
- **修改 AGENTS.md**：在文档同步要求中增加 README 双语硬约束规则，要求修改任一版本时必须同步翻译另一版本

## Capabilities

### New Capabilities

- `readme-i18n`: README 双语支持能力，包含英文默认展示、中文版互引、AGENTS.md 同步约束规则

### Modified Capabilities

（无）

## Impact

- **文档文件**：`README.md`（新建英文版）、`README.zh-CN.md`（从现有中文版重命名）、`AGENTS.md`（增加同步规则）
- **无代码影响**：不涉及任何源代码修改
- **无 CI/CD 影响**：GitHub Pages 部署不受影响
