# Proposal: 修复国际化缓存语言验证问题

## Why

当应用升级后，用户 localStorage 中缓存的语言代码可能在新版本中不再支持（例如从 `zh-CN` 改为 `zh`）。当前 `getDefaultAppLanguage()` 函数直接使用缓存的语言代码，没有验证其有效性，导致：
1. i18n 实例加载失败后降级到英文
2. Redux store 中仍保存无效的语言代码
3. 两者不一致，触发错误 Toast "语言切换失败: zh-CN"
4. 用户每次启动应用都会看到错误提示

**在实现过程中发现两个额外的问题**：
1. **语言切换不持久化**：用户在设置页面切换语言后，`LanguageSetting.tsx` 只更新了 Redux store，没有更新 localStorage，导致刷新后语言丢失
2. **异步资源加载时序问题**：`initI18n()` 异步加载非英文资源后，由于 `i18n.isInitialized` 为 `false`，资源不会被添加到 i18n 实例，导致 `i18n.init()` 时缺少资源，自动降级到英文

这些问题需要在应用启动的早期阶段和语言切换流程中解决，确保缓存语言的有效性和一致性。

## What Changes

- **验证缓存语言**：在 `getDefaultAppLanguage()` 函数中，从 localStorage 读取缓存语言后，验证该语言是否在 `SUPPORTED_LANGUAGE_LIST` 中
- **自动清理无效缓存**：如果缓存的语言不再支持，自动从 localStorage 中删除该缓存项
- **自动迁移逻辑**：支持常见语言代码的自动迁移（如 `zh-CN` → `zh`），提升用户体验
- **用户提示**：当检测到无效缓存并执行迁移或降级时，显示友好的提示信息
- **修复语言切换持久化**：在 `LanguageSetting.tsx` 中，切换语言时同时更新 Redux store 和 localStorage
- **修复异步资源加载时序**：在 `initI18n()` 中，确保异步加载的资源被传递给 `i18n.init()`

## Capabilities

### New Capabilities
- **i18n-cache-validation**: 国际化缓存语言验证与迁移功能，确保应用启动时缓存的语言代码在当前版本中有效且受支持

### Modified Capabilities
无

## Impact

### 代码修改
- `src/lib/global.ts`: 修改 `getDefaultAppLanguage()` 函数，添加缓存验证、自动迁移逻辑
- `src/lib/i18n.ts`:
  - 在 `initI18n()` 中添加 Toast 提示逻辑
  - 修复异步资源加载时序问题，确保 `i18n.init()` 时拥有完整的语言资源
- `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx`: 修复语言切换持久化问题
- `src/utils/constants.ts`: 添加 `LANGUAGE_MIGRATION_MAP` 和 `SUPPORTED_LANGUAGE_SET`
- 翻译文件：添加语言切换失败的错误提示文本

### 依赖影响
- 无新增外部依赖

### 用户体验
- 用户从旧版本升级时，如果语言代码已变更，将自动迁移到新代码（如 `zh-CN` → `zh`）
- 如果语言代码不再支持，将降级到系统语言或英文，并显示提示信息
- 不再出现每次启动都显示的"语言切换失败"错误
- **新增**：用户在设置页面切换语言后，刷新页面语言设置保持不变（修复持久化问题）
- **新增**：应用启动时正确使用用户选择的语言（修复异步资源加载时序问题）

### 兼容性
- 向后兼容：如果用户缓存的语言代码仍然有效，行为与当前版本完全一致
- 前向兼容：未来添加或删除语言时，这个机制会自动处理缓存一致性

## Implementation Notes

### 发现的额外问题

在实现过程中，发现并修复了两个额外的问题：

#### 问题 1：语言切换不持久化

**现象**：用户在设置页面切换语言后，刷新页面语言会被重置成英文。

**根因**：`LanguageSetting.tsx` 的 `onLangChange` 函数只更新了 Redux store，没有：
1. 调用 `changeAppLanguage()` 来实际切换 i18n 的语言
2. 更新 localStorage

**解决方案**：在 `onLangChange` 中：
1. 先调用 `await changeAppLanguage(lang)` 切换 i18n 语言
2. 成功后更新 Redux store 和 localStorage
3. 失败时显示错误 Toast

#### 问题 2：异步资源加载时序问题

**现象**：即使 localStorage 中保存了正确的语言代码（如 'zh'），刷新后仍被重置成英文。

**根因**：`initI18n()` 调用 `await loadLanguage('zh')` 异步加载中文资源，但此时 `i18n.isInitialized` 为 `false`，所以资源不会被添加到 i18n 实例。然后调用 `i18n.init({ lng: 'zh', resources: { en: {...} } })`，由于 resources 中没有中文资源，i18n 自动降级到英文。

**解决方案**：在 `initI18n()` 中，成功加载非英文语言资源后，将其添加到 `initialResources` 中：
```typescript
if (languageResult.lang !== 'en') {
  try {
    await loadLanguage(languageResult.lang);
    actualLang = languageResult.lang;
    
    // 关键修复：将加载的资源添加到 initialResources 中
    const loadedResources = languageResourcesCache.get(languageResult.lang);
    if (loadedResources) {
      initialResources[languageResult.lang] = { translation: loadedResources };
    }
  } catch (error) {
    // 错误处理...
  }
}
```

这个修改虽然违反了原始的 Non-Goal（"不修改 i18n 的初始化流程"），但是必要的 bug 修复。
