# Proposal: 国际化架构重构

## Why

当前国际化模块存在配置源分散、Toast 消息显示不可靠、语言持久化需要手动同步等问题，导致代码重复、维护困难且存在潜在的状态不一致风险。随着未来可能支持更多语言，现有架构的复杂度和维护成本将进一步增加。现在进行重构，可以在问题恶化之前建立清晰、可维护的架构基础。

## What Changes

本次重构聚焦于架构优化和代码质量提升，不引入新的用户可见功能：

- **统一语言配置源**: 将分散在 `constants.ts` 和 `LanguageSetting.tsx` 的语言配置合并为单一数据源（`LANGUAGE_CONFIGS`），自动派生所需的列表、集合和映射，消除重复定义
- **Toast 消息队列机制**: 引入 `ToastQueue` 类管理消息生命周期，解决初始化时 `<Toaster />` 组件未挂载导致的 Toast 调用静默失败问题，确保所有消息可靠显示
- **自动语言持久化**: 通过 Redux Middleware 自动监听语言变更并同步到 localStorage，消除手动调用 `localStorage.setItem()` 的重复代码，避免遗漏和不一致
- **清理废弃代码**: 删除 `i18n.ts` 中旧的动态导入 toast 逻辑，简化 `LanguageSetting.tsx` 的持久化代码

## Capabilities

### New Capabilities
无（本次重构不引入新的用户可见能力）

### Modified Capabilities
无（本次重构不改变 `i18n-lazy-loading` 规范中的任何需求，仅优化实现架构）

**说明**: 虽然实现细节有较大调整（如引入 Toast 队列、Middleware 自动持久化），但这些都是在现有需求框架内的优化，不改变用户可见的行为或 API 契约。所有 `i18n-lazy-loading` 规范中定义的需求场景（如语言切换、加载失败重试、缓存机制等）在重构后继续满足。

## Impact

### 新增文件
- `src/lib/toastQueue.ts` - Toast 消息队列管理类
- `src/store/middleware/languagePersistence.ts` - 语言自动持久化 Middleware

### 修改文件
- `src/utils/constants.ts` - 添加 `LANGUAGE_CONFIGS` 统一配置源，派生 `SUPPORTED_LANGUAGE_*` 数据
- `src/lib/i18n.ts` - 移除旧的动态导入 toast 逻辑，使用 `toastQueue.enqueue()` 发送消息
- `src/lib/global.ts` - 使用 `SUPPORTED_LANGUAGE_MAP.get()` 替代 `LANGUAGE_LABELS`（消除对旧配置的依赖）
- `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx` - 从 `LANGUAGE_CONFIGS` 派生语言选项，移除手动 `localStorage.setItem()` 调用
- `src/store/index.ts` - 集成 `languagePersistence` middleware
- `src/main.tsx` - 在 Toaster 组件挂载后调用 `toastQueue.markReady()`

### 删除内容
- `src/lib/i18n.ts:24-37` - 旧的动态导入 toast 逻辑
- `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx:46-50` - 手动 localStorage 持久化代码

### 依赖和兼容性
- 无新增外部依赖（继续使用现有的 `sonner`、`i18next`、`@reduxjs/toolkit`）
- 向后兼容现有 API 和用户行为
- 不影响现有测试（重构后测试逻辑不变）

### 性能影响
- **正面影响**:
  - 消息队列机制确保 Toast 可靠显示，提升用户体验
  - 统一配置源减少运行时计算（`SUPPORTED_LANGUAGE_SET` 和 `SUPPORTED_LANGUAGE_MAP` 预计算）
  - Middleware 自动持久化减少重复代码执行
- **可忽略影响**:
  - Toast 队列的内存开销（仅存储少数待显示消息，每个消息对象 < 1 KB）
  - Middleware 的执行开销（每次语言变更增加 < 1ms）

### 风险评估

**整体风险等级**: 低到中

**已识别的风险**:

| 风险 | 严重程度 | 缓解措施 |
|------|---------|---------|
| Toast 队列并发安全问题 | 中 | 添加 `isFlushing` 标志防止重复 flush；单元测试覆盖并发场景；集成测试验证消息顺序显示 |
| Toast 队列内存泄漏 | 低 | 单元测试覆盖队列清空逻辑；集成测试验证 Toast 显示；代码审查确保 `main.tsx` 正确调用 `markReady()` |
| localStorage 写入失败导致状态不一致 | 低 | Middleware 静默降级，不抛出错误；下次启动使用默认语言逻辑；不影响当前会话的 Redux 状态 |
| 配置迁移遗漏 | 中 | 全局搜索确认所有引用点（特别是 `global.ts`）；TypeScript 编译时检查；分阶段迁移（先添加新配置、再更新引用、最后删除旧代码） |
| Toast 消息重叠导致用户来不及阅读 | 低 | 使用顺序显示策略，每个消息间隔 500ms |
| 类型安全问题（action.payload） | 低 | Middleware 中添加 `typeof` 检查，确保只存储字符串类型 |

**测试策略**:
- 单元测试：ToastQueue、languagePersistence middleware、配置派生逻辑
- 集成测试：应用初始化时 toastQueue 行为、语言切换完整数据流（UI → Redux → localStorage → 重启恢复）
- 手动测试：所有语言切换场景（zh ↔ en ↔ fr）、应用重启后语言偏好保持、localStorage 写入失败降级行为

**回滚方案**: 如遇问题可快速回滚到重构前实现（Git commit 粒度控制，每个 Phase 独立 commit）
