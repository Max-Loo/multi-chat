## Why

当前 ModelProviderSetting 组件及其子组件中存在大量硬编码的中文文本，导致应用无法支持多语言切换。虽然部分文本已经在 `setting.json` 中有翻译，但子组件中直接使用了硬编码字符串而不是使用 i18n 系统，违反了项目的国际化规范。

## What Changes

- 将所有子组件中的硬编码中文文本替换为 i18n 翻译键
- 在 `src/locales/zh/setting.json` 和 `src/locales/en/setting.json` 中添加缺失的翻译条目
- 修改日期格式化逻辑，根据当前语言动态设置 locale（而非硬编码为 `'zh-CN'`）
- 确保所有文本显示都通过 `useTranslation` hook 或 `t` 函数实现

## Capabilities

### New Capabilities
无

### Modified Capabilities

- **model-provider-display**: 在现有规范中添加国际化要求，要求所有用户可见的文本必须支持多语言，包括：
  - 供应商卡片的状态标签（"可用"/"不可用"）
  - 模型数量统计（"共 X 个模型"、"找到 X 个模型"）
  - 搜索框占位符和提示文本
  - 元数据标签（"API 端点:"、"供应商 ID:"）
  - 日期时间格式必须根据当前语言动态调整
  - 错误提示文本

## Impact

**受影响的组件**:
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.tsx`
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderHeader.tsx`
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ErrorAlert.tsx`
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardHeader.tsx`
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardSummary.tsx`
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ModelSearch.tsx`
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderMetadata.tsx`

**受影响的文件**:
- `src/locales/zh/setting.json` - 添加新的翻译键
- `src/locales/en/setting.json` - 添加对应的英文翻译

**无需添加新的依赖**（项目已配置 react-i18next）
