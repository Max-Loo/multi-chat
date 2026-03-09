## Why

当前应用的国际化配置存在翻译不完整的问题，法语翻译缺少部分键值，可能导致法语用户看到未翻译的文本或空白内容，影响用户体验。

## What Changes

- **补充法语翻译缺失内容**：
  - 在 `src/locales/fr/setting.json` 中添加 `autoNaming.title` 和 `autoNaming.description` 翻译
  - 在 `src/locales/fr/setting.json` 中添加 `languageSwitchFailed` 翻译
- **验证所有语言的翻译完整性**：确保中文、英文、法语三种语言的所有翻译文件键值一致
- **建立翻译检查机制**：添加自动化工具或脚本，防止未来出现翻译遗漏

## Capabilities

### New Capabilities
- `i18n-completeness-check`: 国际化翻译完整性检查能力，确保所有支持语言的翻译文件键值一致

### Modified Capabilities
（无）

## Impact

**受影响的文件**：
- `src/locales/fr/setting.json` - 需要补充 3 个缺失的翻译键值

**受影响的系统**：
- 国际化（i18n）系统
- 法语用户体验

**依赖关系**：
- 无新增依赖
- 不影响现有 API 或代码逻辑
