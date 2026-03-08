## Why

为法语用户提供本地化体验，扩展应用的国际化支持范围。当前应用仅支持中文和英文，添加法语能够满足法语用户的基本使用需求，提升用户体验。

## What Changes

- **新增法语翻译文件**：在 `src/locales/fr/` 目录下创建 7 个翻译文件
  - `common.json` - 通用 UI 文本（25 个条目）
  - `chat.json` - 聊天相关文本（33 个条目）
  - `navigation.json` - 导航菜单文本（5 个条目）
  - `setting.json` - 设置页面文本（嵌套结构，约 20+ 字符串）
  - `model.json` - 模型管理文本（28 个条目）
  - `table.json` - 表格相关文本（10 个条目）
  - `provider.json` - 供应商相关文本（当前为空）
- **更新语言配置**：在 `src/utils/constants.ts` 的 `SUPPORTED_LANGUAGE_LIST` 中添加 `'fr'`
- **更新语言选择器**：在 `LanguageSetting.tsx` 的 `LANGUAGE_OPTIONS` 中添加法语选项 `{ value: "fr", label: "🇫🇷 Français" }`

**无破坏性变更** - 现有中文和英文用户不受影响

## Capabilities

### New Capabilities
- `french-i18n`: 法语国际化支持，包括所有 UI 文本的法语翻译和语言切换功能

### Modified Capabilities
- 无现有功能的需求变更

## Impact

**影响的代码文件**：
- `src/utils/constants.ts` - 修改 `SUPPORTED_LANGUAGE_LIST` 数组
- `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx` - 修改 `LANGUAGE_OPTIONS` 数组

**新增的文件**：
- `src/locales/fr/common.json`
- `src/locales/fr/chat.json`
- `src/locales/fr/navigation.json`
- `src/locales/fr/setting.json`
- `src/locales/fr/model.json`
- `src/locales/fr/table.json`
- `src/locales/fr/provider.json`

**依赖项**：无新增依赖项（使用现有的 i18next + react-i18next）

**系统影响**：
- 用户可在设置中选择法语作为应用语言
- 系统语言为法语的用户首次启动时将自动使用法语（如果系统语言检测到 'fr'）
- 法语用户的 localStorage 将保存语言偏好为 'fr'
