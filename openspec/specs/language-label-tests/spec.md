# 语言标签测试能力规范

## Purpose

测试 `getLanguageLabel` 函数的语言代码到显示标签的映射逻辑。验证支持的语言代码能正确返回标签，不支持的语言代码能安全回退。

## Requirements

### Requirement: getLanguageLabel 返回语言代码对应的显示标签

系统 SHALL 根据语言代码从 `SUPPORTED_LANGUAGE_MAP` 查找对应的显示标签。

#### Scenario: 支持的语言代码返回对应标签
- **WHEN** 调用 `getLanguageLabel('zh')`
- **THEN** 系统 SHALL 返回中文语言的显示标签字符串

#### Scenario: 不支持的语言代码返回原代码
- **WHEN** 调用 `getLanguageLabel('unknown')`
- **THEN** 系统 SHALL 返回 `'unknown'` 原始字符串
