# Design: 国际化缓存语言验证与迁移

## Context

### 当前状态
当前 `src/lib/global.ts` 中的 `getDefaultAppLanguage()` 函数直接从 localStorage 读取缓存的语言代码，没有验证其有效性。当应用升级后语言代码变更时（如 `zh-CN` → `zh`），会导致：

1. **状态不一致**：i18n 实例降级到英文，但 Redux store 中仍保存无效语言代码
2. **错误提示**：每次启动都显示"语言切换失败"错误 Toast
3. **用户体验差**：用户无法理解为什么语言设置会失效

### 约束条件
- **向后兼容**：必须保持对有效缓存语言的完全兼容
- **性能要求**：不能显著增加应用启动时间（目标 < 5ms）
- **依赖最小**：不能引入新的外部依赖
- **优雅降级**：所有错误场景都不应阻塞应用启动

### 涉及系统
- `src/lib/global.ts`: 语言检测逻辑
- `src/lib/i18n.ts`: i18n 初始化
- `src/store/slices/appConfigSlices.ts`: Redux store 状态管理
- `src/store/middleware/appConfigMiddleware.ts`: 语言切换监听

## Goals / Non-Goals

### Goals
- ✅ 验证缓存语言代码的有效性，防止状态不一致
- ✅ 自动迁移已知的语言代码变更（如 `zh-CN` → `zh`）
- ✅ 自动清理无效缓存，避免重复错误
- ✅ 提供清晰的用户提示，说明语言变化原因
- ✅ 保持向后兼容，不影响有效缓存的用户体验
- ✅ 支持前向兼容，适应未来语言的添加和删除

### Non-Goals
- ❌ 大幅重构 i18n 的初始化流程（但会修复异步资源加载的时序 bug）
- ❌ 改变用户手动切换语言的交互逻辑
- ❌ 实现复杂的语言代码推测逻辑（如基于地理位置）
- ❌ 提供用户界面手动管理缓存

## Decisions

### 决策 1: 函数职责分离与返回值结构

**选择**：`getDefaultAppLanguage()` 负责验证和迁移逻辑，返回包含语言代码和迁移信息的对象；`initI18n()` 负责根据迁移信息显示 Toast。

**理由**：
- **职责清晰**：`getDefaultAppLanguage()` 是纯函数，不包含 UI 副作用；`initI18n()` 负责初始化和用户反馈
- **早期执行**：在应用启动流程的最早阶段执行验证，确保后续步骤都使用有效的语言代码
- **可测试性**：纯函数易于单元测试，Toast 逻辑可以在集成测试中验证
- **最小改动**：只需要修改 `getDefaultAppLanguage()` 的返回值类型和 `initI18n()` 的部分逻辑

**返回值结构**：
```typescript
interface LanguageResult {
  lang: string          // 最终使用的语言代码
  migrated: boolean     // 是否执行了迁移
  from?: string         // 迁移前的语言代码（如果 migrated 为 true）
  fallbackReason?: 'cache-invalid' | 'system-lang' | 'default'
}

export const getDefaultAppLanguage = async (): Promise<LanguageResult> => {
  // ... 验证和迁移逻辑
  return { lang: 'zh', migrated: true, from: 'zh-CN' }
}
```

**替代方案**：
- 在 `global.ts` 中直接调用 Toast：❌ 违反单一职责原则，工具函数不应包含 UI 逻辑
- 在 `initializeAppLanguage` thunk 中验证：❌ 太晚，i18n 已经初始化完成
- 在 middleware 中验证：❌ 每次语言变化都验证，性能开销大

### 决策 2: 使用静态映射表实现语言代码迁移

**选择**：在 `src/utils/constants.ts` 中定义 `LANGUAGE_MIGRATION_MAP` 常量，映射旧语言代码到新语言代码。

**理由**：
- **显式声明**：迁移规则明确且易于维护
- **性能高效**：O(1) 查找时间
- **类型安全**：使用 TypeScript 常量，编译时检查
- **可测试**：映射表易于单元测试

**实现**：
```typescript
// src/utils/constants.ts
export const LANGUAGE_MIGRATION_MAP: Record<string, string> = {
  'zh-CN': 'zh',
  // 未来可添加更多迁移规则：
  // 'zh-TW': 'zh',
  // 'es-ES': 'es',
} as const
```

**替代方案**：
- 基于正则表达式的自动推测：❌ 不可靠，可能误判
- 远程配置的迁移规则：❌ 增加复杂度和网络依赖

### 决策 3: Toast 提示的时机和位置

**选择**：Toast 逻辑由 `src/lib/i18n.ts` 的 `initI18n()` 函数实现，根据 `getDefaultAppLanguage()` 返回的迁移信息决定是否显示 Toast。

**理由**：
- **职责分离**：`initI18n()` 已经负责用户反馈（系统语言加载失败时的 Toast），语言迁移的 Toast 应该放在同一位置
- **架构清晰**：`global.ts` 保持为纯工具函数库，不包含 UI 副作用
- **一致性**：所有 i18n 相关的用户反馈都在 `i18n.ts` 中统一管理
- **用户友好**：只在有实际变化时通知用户，避免过度打扰

**Toast 分类**：
- **信息 Toast**（3 秒）：迁移成功、降级到系统语言
- **警告 Toast**（5 秒）：降级到英文（因为更严重）

**实现**：
```typescript
// src/lib/i18n.ts 的 initI18n() 函数中
const result = await getDefaultAppLanguage()
const { lang, migrated, from, fallbackReason } = result

// 根据迁移信息显示 Toast
if (migrated && from) {
  toast.info(`检测到语言代码已更新为${getLanguageLabel(lang)}（${lang}）`)
} else if (fallbackReason === 'system-lang') {
  toast.info(`已切换到系统语言：${getLanguageLabel(lang)}`)
} else if (fallbackReason === 'default') {
  toast.warning("语言代码已失效，已切换到英文")
}
```

**替代方案**：
- 在 `global.ts` 中直接调用 Toast：❌ 违反单一职责原则
- 始终显示 Toast：❌ 对有效缓存用户造成困扰
- 使用模态对话框：❌ 阻塞应用启动，过于侵入

### 决策 4: 错误处理策略

**选择**：所有错误都优雅降级，永不阻塞应用启动。

**理由**：
- **健壮性**：确保应用在所有场景下都能成功启动
- **用户友好**：错误信息对普通用户不透明，避免技术细节

**错误场景处理**：
- **localStorage 读取失败**（如隐私模式）：降级到系统语言或英文，记录 console.warn
- **localStorage 写入失败**（如存储空间满）：仅在内存中更新缓存，记录 console.warn
- **Toast 显示失败**（如 toastFunc 为 null）：降级到 console.warn，不阻塞启动

**替代方案**：
- 抛出异常并中断启动：❌ 导致应用无法使用
- 显示技术性错误消息：❌ 普通用户无法理解

### 决策 5: 修复异步资源加载的时序问题

**背景**：在实现过程中发现，`initI18n()` 调用 `loadLanguage()` 异步加载非英文资源后，由于此时 `i18n.isInitialized` 为 `false`，资源不会被添加到 i18n 实例中。这导致 `i18n.init({ lng: 'zh', resources: { en: {...} } })` 时缺少中文资源，自动降级到英文。

**选择**：在 `initI18n()` 中，成功加载非英文语言资源后，将其添加到 `initialResources` 中，然后传递给 `i18n.init()`。

**理由**：
- **最小修改**：不改变 `loadLanguage()` 的缓存逻辑，只在 `initI18n()` 中做适配
- **保持性能**：异步加载的按需加载策略不变，不影响启动性能
- **修复根本原因**：确保 `i18n.init()` 时拥有完整的语言资源

**实现**：
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

**风险**：
- 这个修改违反了原始的 Non-Goal（"不修改 i18n 的初始化流程"），但是必要的 bug 修复
- 如果未来 `loadLanguage()` 的实现改变，这个适配逻辑可能需要同步修改

### 决策 6: 修复语言切换持久化问题

**背景**：在实现过程中发现，用户在设置页面切换语言后，`LanguageSetting.tsx` 只更新了 Redux store，没有：
1. 调用 `changeAppLanguage()` 来实际切换 i18n 的语言
2. 更新 localStorage

这导致刷新页面后语言设置丢失，被重置为英文。

**选择**：在 `LanguageSetting.tsx` 的 `onLangChange` 函数中，先调用 `changeAppLanguage()` 切换 i18n 语言，成功后再更新 Redux store 和 localStorage。

**理由**：
- **正确顺序**：先切换 i18n 语言，再更新状态，确保一致性
- **错误处理**：如果切换失败，显示错误 Toast，不更新状态
- **用户体验**：用户切换语言后，刷新页面语言设置保持不变
- **最小改动**：只在 `onLangChange` 函数中修改，不影响其他逻辑

**实现**：
```typescript
const onLangChange = async (lang: string) => {
  if (lang === language || isChanging) return;
  setIsChanging(true);

  try {
    // 先调用 changeAppLanguage 切换 i18n 语言
    const { success } = await changeAppLanguage(lang);
    
    if (success) {
      // 成功后更新 Redux store 和 localStorage
      dispatch(setAppLanguage(lang));
      try {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error);
      }
    } else {
      // 失败时显示错误提示
      toast.error(t($ => ($.setting as any).languageSwitchFailed));
    }
  } catch (error) {
    console.error('Failed to change language:', error);
    toast.error(t($ => ($.setting as any).languageSwitchFailed));
  } finally {
    setTimeout(() => setIsChanging(false), 500);
  }
};
```

**风险**：
- 增加了异步操作的复杂度，需要处理加载状态和错误场景
- 需要在翻译文件中添加错误提示文本

### 决策 7: 多级降级策略

**选择**：遵循四级降级策略，确保始终能选择有效语言。

**降级顺序**：
1. **缓存语言**：直接使用（如果有效）
2. **迁移语言**：执行迁移规则（如果存在）
3. **系统语言**：检测系统语言（如果支持）
4. **默认语言**：降级到英文（兜底）

**理由**：
- **尊重用户偏好**：优先使用用户之前选择的语言
- **智能迁移**：自动适应语言代码变更
- **系统适配**：利用系统语言作为备选
- **可靠兜底**：确保英文始终可用

**流程图**：
```
读取 localStorage 缓存
    │
    ├─ 有效 → 使用缓存语言 ✅
    │
    └─ 无效
        │
        ├─ 存在迁移规则 → 迁移 + 更新缓存 ✅
        │
        └─ 无迁移规则
            │
            ├─ 系统语言支持 → 使用系统语言 ✅
            │
            └─ 系统语言不支持 → 降级到英文 ✅
```

## Risks / Trade-offs

### Risk 1: 性能开销
**风险**：新增验证逻辑可能增加 `getDefaultAppLanguage()` 的执行时间，影响应用启动性能。

**缓解措施**：
- 使用 O(1) 的 Map/Set 查找（`SUPPORTED_LANGUAGE_LIST` 已是数组）
- 静态映射表，避免动态计算
- localStorage 操作仅在必要时执行（无效缓存时才删除）

**测试**：
- 在隐私模式（localStorage 禁用）下测试性能
- 在有效缓存场景下测试性能（最常见）

### Risk 2: 迁移规则维护
**风险**：语言代码迁移规则可能遗漏或错误，导致用户语言设置意外重置。

**缓解措施**：
- TypeScript 编译时检查映射表的键值类型
- 添加单元测试覆盖所有已知的迁移场景
- 在 CHANGELOG 中记录语言代码变更

**未来改进**：
- 考虑使用自动测试检测 `SUPPORTED_LANGUAGE_LIST` 变更
- 在 CI 中检查是否有未添加迁移规则的语言代码删除

### Risk 3: 用户混淆
**风险**：Toast 提示可能让用户困惑，不理解为什么语言会"自动变化"。

**缓解措施**：
- Toast 内容明确说明原因（"检测到语言代码已更新"）
- 仅在首次升级时显示（一次性操作）
- 提供文档支持（FAQ 中说明语言自动迁移）

**替代方案**：
- 如果反馈不佳，可以改为静默迁移，不显示 Toast

### Trade-off 1: 自动迁移 vs. 用户选择
**权衡**：自动迁移方便用户，但可能在某些场景下不符合用户意图（如用户明确选择 `zh-CN` 而非 `zh`）。

**决策**：选择自动迁移，因为：
- 语言代码变更是技术细节，用户通常不关心
- 自动迁移减少用户操作步骤
- 如果用户不满意，可以手动切换语言

### Trade-off 2: Toast 提示频率
**权衡**：显示 Toast 提升透明度，但可能造成打扰。

**决策**：仅在首次升级时显示（一次性），平衡透明度和用户体验。

## Migration Plan

### 部署步骤
1. **代码实现**
   - 修改 `src/lib/global.ts` 的 `getDefaultAppLanguage()` 函数
   - 在 `src/utils/constants.ts` 中添加 `LANGUAGE_MIGRATION_MAP`
   - 添加单元测试覆盖所有场景

2. **测试验证**
   - 测试有效缓存：确保行为与当前版本一致
   - 测试无效缓存：验证降级逻辑正确
   - 测试迁移场景：验证 Toast 显示和缓存更新
   - 测试错误场景：验证优雅降级

3. **发布上线**
   - 在 CHANGELOG 中记录变更
   - 在 FAQ 中添加语言自动迁移说明
   - 监控错误日志，确保无异常

### 回滚策略
- **代码回滚**：如果出现严重问题，可以快速回滚到上一个版本
- **数据回滚**：无需数据回滚，因为：
  - 无效缓存已被删除（用户下次启动会重新选择）
  - 迁移后的缓存在新版本中仍然有效
  - 回滚到旧版本后，旧版本会重新处理缓存

## Open Questions

### Q1: 是否需要支持更复杂的迁移场景？
**问题**：当前设计仅支持一对一的语言代码映射（如 `zh-CN` → `zh`）。是否需要支持一对多（如基于地区）或条件迁移？

**当前决策**：不需要。一对一映射已覆盖当前所有已知场景，复杂场景可以手动选择语言。

**未来考虑**：如果有实际需求，可以扩展 `LANGUAGE_MIGRATION_MAP` 为函数，支持动态逻辑。

### Q2: Toast 提示是否需要可配置？
**问题**：部分用户可能不喜欢自动迁移的 Toast 提示。是否需要提供设置选项让用户禁用这些提示？

**当前决策**：不需要。Toast 仅在首次升级时显示，不会重复打扰。如果反馈不佳，可以在后续版本中移除。

### Q3: 是否需要记录迁移事件到 analytics？
**问题**：为了了解语言代码迁移的实际影响范围，是否需要记录匿名统计？

**当前决策**：暂不记录。可以通过错误日志和用户反馈了解情况，避免隐私问题。

---

## 附录

### 性能估算
- **缓存验证**（Set.has）：O(1)，< 0.01ms（优化后使用 Set 而非 Array.includes）
- **迁移映射查找**（Object[key]）：O(1)，< 0.01ms
- **localStorage 操作**：~1ms
- **对象构造**（LanguageResult）：~0.1ms
- **Toast 显示**：异步操作，不阻塞

**总开销**：< 5ms，符合性能要求

### 测试策略
**单元测试**：
- 有效缓存场景
- 无效缓存 + 无迁移规则场景
- 无效缓存 + 有迁移规则场景
- 迁移目标语言不支持场景
- localStorage 读写失败场景
- Toast 显示失败场景

**集成测试**：
- 应用启动流程测试（从初始化到界面显示）
- 语言切换测试（验证 middleware 不受影响）

**手动测试**：
- 从旧版本升级到新版本（模拟缓存迁移）
- 隐私模式测试（localStorage 禁用）
