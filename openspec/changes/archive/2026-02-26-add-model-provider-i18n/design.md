## Context

**当前状态**:
ModelProviderSetting 组件及其子组件中存在大量硬编码的中文文本。虽然项目已经配置了 react-i18next 国际化系统，并且部分翻译已存在于 `src/locales/setting.json` 中，但子组件直接使用硬编码字符串，未使用 `useTranslation` hook。

**约束条件**:
- 必须与现有 i18n 系统架构保持一致
- 不应引入新的依赖（项目已使用 react-i18next）
- 组件的 props 接口不应改变（仅修改内部实现）
- 必须支持中英文双语

**相关方**:
- 前端开发者：需要在多个组件中添加 i18n 支持
- 用户：获得多语言界面体验

## Goals / Non-Goals

**Goals:**
- 移除所有子组件中的硬编码中文文本
- 在语言文件中添加完整的翻译键值对
- 实现根据当前语言动态调整日期格式
- 确保所有用户可见的文本都通过 i18n 系统渲染

**Non-Goals:**
- 不修改组件的 props 接口
- 不改变组件的业务逻辑或数据流
- 不重构组件的整体架构
- 不添加新的依赖或配置

## Decisions

### 1. 翻译键的命名结构

**决策**: 使用嵌套对象结构，将新增翻译键放在 `$.setting.modelProvider` 命名空间下。

**理由**:
- 保持与现有翻译键的一致性（如 `$.setting.modelProvider.title`）
- 避免命名冲突
- 便于组织和维护

**替代方案**:
- 为每个组件创建独立命名空间（如 `$.providerHeader`、`$.errorAlert`）→ ❌ 过于分散，增加维护成本

### 2. 动态值的处理方式

**决策**: 使用 i18next 的插值（interpolation）功能处理动态值（如模型数量）。

**理由**:
- 标准 i18n 实践，支持语法如 `{{count}}`
- 翻译可以包含不同的词序（适应不同语言习惯）
- 类型安全（TypeScript 支持）

**示例**:
```json
{
  "modelCount": "共 {{count}} 个模型",
  "searchResult": "找到 {{count}} 个模型"
}
```

### 3. 日期本地化实现

**决策**: 从 i18n 实例获取当前语言代码，传递给 `toLocaleString()` 方法。

**理由**:
- 利用浏览器内置的日期格式化能力
- 无需引入额外的日期库（如 date-fns）
- 与 i18n 语言切换自动同步

**实现**:
```typescript
const { i18n } = useTranslation();
const locale = i18n.language; // 'zh' or 'en'
date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {...});
```

**替代方案**:
- 使用 date-fns + locale → ❌ 增加依赖，项目已有简单场景无需引入重库

### 4. 组件实现模式

**决策**: 每个子组件独立使用 `useTranslation` hook，不通过 props 传递 `t` 函数。

**理由**:
- React hooks 的标准用法
- 组件保持自治和可复用
- 避免逐层传递 props（prop drilling）

**替代方案**:
- 通过 props 从父组件传递 `t` 函数 → ❌ 增加组件耦合度，违反组件封装原则

### 5. 翻译键的访问方式

**决策**: 使用类型安全的嵌套对象访问器 `t($ => $.setting.modelProvider.keyName)`。

**理由**:
- 项目已有约定（见现有代码）
- 提供完整的类型推断和自动补全
- 编译时检查翻译键是否存在

**替代方案**:
- 字符串键 `t('setting.modelProvider.keyName')` → ❌ 无类型检查，易出错

## Risks / Trade-offs

### 风险 1: 翻译键遗漏导致显示问题
- **风险**: 如果某个翻译键在语言文件中缺失，会显示键名而非翻译文本
- **缓解措施**:
  - 使用类型安全的访问器，编译时检测缺失键
  - 在实现时逐个组件验证，确保所有文本都有对应翻译
  - 添加中英文翻译时同步进行，避免遗漏

### 风险 2: 日期格式在不同语言下的显示差异
- **风险**：不同语言和地区的日期格式可能不符合用户预期
- **缓解措施**：
  - 测试中英文切换时的日期显示效果
  - 使用标准 locale 字符串（`zh-CN`, `en-US`）确保一致性
  - 如需进一步定制，可在语言文件中添加日期格式配置

### 权衡: 组件数量较多，修改工作量较大
- **权衡**: 需要修改 7 个组件文件和 2 个语言文件
- **缓解措施**:
  - 按组件逐步实现，每次修改一个组件并测试
  - 使用统一的翻译键命名规范，减少决策时间
  - 现有代码已提供良好的模式参考

## Migration Plan

**实施步骤**:

1. **扩展语言文件**（无破坏性）
   - 在 `src/locales/zh/setting.json` 中添加新的翻译键
   - 在 `src/locales/en/setting.json` 中添加对应的英文翻译
   - 验证 JSON 格式正确性

2. **修改子组件**（按依赖顺序）
   - ProviderHeader.tsx - 添加 `useTranslation`，替换硬编码文本和日期格式化
   - ErrorAlert.tsx - 替换错误提示文本
   - ProviderCardHeader.tsx - 替换状态标签文本
   - ProviderCardSummary.tsx - 替换模型数量统计，使用插值
   - ModelSearch.tsx - 替换占位符和结果统计，使用插值
   - ProviderMetadata.tsx - 替换元数据标签和按钮文本

3. **测试验证**
   - 启动应用，切换中英文，验证所有文本正确显示
   - 检查日期格式是否随语言切换而变化
   - 验证动态值（模型数量）正确插入

4. **代码审查**
   - 运行 `pnpm lint` 和 `pnpm tsc` 确保无语法错误
   - 检查是否还有遗留的硬编码文本

**回滚策略**:
- 所有修改都在组件内部实现，不涉及外部 API 或数据结构变更
- 如发现问题，可单独回滚某个组件的修改
- 语言文件的添加不会破坏现有功能（仅新增键值对）

## Open Questions

无（所有技术决策已在上述 Decisions 部分明确）。
