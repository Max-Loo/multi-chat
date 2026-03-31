## ADDED Requirements

### Requirement: cn 函数位于 src/utils/utils.ts
系统 SHALL 将 `cn()` 函数导出在 `src/utils/utils.ts` 中，不再存在于 `src/lib/utils.ts`。

#### Scenario: UI 组件正确导入 cn
- **WHEN** 任何 UI 组件导入 `cn` 函数
- **THEN** 从 `@/utils/utils` 路径导入，而非 `@/lib/utils`

#### Scenario: lib/utils.ts 文件已删除
- **WHEN** 迁移完成
- **THEN** `src/lib/utils.ts` 文件不存在

### Requirement: i18n 服务位于 src/services/i18n.ts
系统 SHALL 将 i18n 初始化、语言切换、安全翻译等函数导出在 `src/services/i18n.ts` 中。

#### Scenario: 正确导入 i18n 功能
- **WHEN** 任何模块需要 i18n 功能（initI18n、changeAppLanguage、tSafely 等）
- **THEN** 从 `@/services/i18n` 路径导入

### Requirement: toast 服务位于 src/services/toast/
系统 SHALL 将 toast 队列和 ToasterWrapper 组件放在 `src/services/toast/` 目录下。

#### Scenario: 正确导入 toast 功能
- **WHEN** 任何模块需要 toast 功能（toastQueue、rawToast）
- **THEN** 从 `@/services/toast` 路径导入

### Requirement: initialization 服务位于 src/services/initialization/
系统 SHALL 将 InitializationManager 和相关类型放在 `src/services/initialization/` 目录下。

#### Scenario: 正确导入初始化功能
- **WHEN** 任何模块需要初始化功能（InitializationManager、InitConfig 等）
- **THEN** 从 `@/services/initialization` 路径导入

### Requirement: global 工具位于 src/services/global.ts
系统 SHALL 将语言检测和全局工具函数放在 `src/services/global.ts` 中。

#### Scenario: 正确导入 global 功能
- **WHEN** 任何模块需要 getDefaultAppLanguage、getLanguageLabel 等函数
- **THEN** 从 `@/services/global` 路径导入

### Requirement: src/lib/ 目录不存在
系统 SHALL 在迁移完成后删除 `src/lib/` 目录，其中不应保留任何文件。

#### Scenario: lib 目录已完全清理
- **WHEN** 迁移完成
- **THEN** `src/lib/` 目录不存在

#### Scenario: 所有功能正常工作
- **WHEN** 运行 `pnpm tsc` 和 `pnpm test`
- **THEN** 所有类型检查和测试通过，无 import 错误
