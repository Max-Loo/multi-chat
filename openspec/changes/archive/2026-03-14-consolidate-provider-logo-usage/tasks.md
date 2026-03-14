## 1. 重构 ModelProviderDisplay 组件

- [x] 1.1 在 `ModelProviderDisplay.tsx` 中导入 `getProviderLogoUrl`
- [x] 1.2 将内联 URL 替换为 `getProviderLogoUrl(provider.providerKey)`

## 2. 重构 ModelSidebar 组件

- [x] 2.1 在 `ModelSidebar.tsx` 中导入 `getProviderLogoUrl`
- [x] 2.2 将内联 URL 替换为 `getProviderLogoUrl(provider.providerKey)`

## 3. 验证

- [x] 3.1 确认两个组件的 logo 显示正常
- [x] 3.2 确认代码中无其他内联 URL 拼接（通过 grep 验证）
