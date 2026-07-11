## MODIFIED Requirements

### Requirement: Rolldown 打包器下的分包兼容性
升级到 Vite 8 后，默认打包器从 Rollup 切换为 Rolldown 1.0。分包配置从 `build.rollupOptions.output.manualChunks` 迁移到 `build.rolldownOptions.output.advancedChunks`，MUST 保持与 Rollup 相同的分包行为，确保所有现有 chunk（`vendor-react`、`vendor-redux`、`vendor-ai`、`vendor-zod`、`vendor-highlight-core`、`vendor-highlight-languages`、`chunk-init` 等）的归属规则不变。

#### Scenario: Rolldown 下包名精确提取保持一致
- **WHEN** Vite 8 使用 Rolldown 作为默认打包器进行构建
- **THEN** `getPackageName` 函数 MUST 仍能正确从 pnpm 存储路径中提取实际包名，Rolldown 传入的模块路径格式不影响提取结果

#### Scenario: Rolldown 下 vendor chunk 归属不变
- **WHEN** Vite 8 + Rolldown 构建完成后
- **THEN** 各 vendor chunk 的依赖归属 MUST 与 Vite 7 + Rollup 构建结果一致，包括 `vendor-react`、`vendor-redux`、`vendor-router`、`vendor-i18n`、`vendor-zod`、`vendor-markdown`、`vendor-ai`、`vendor-icons`、`vendor-ui-utils`、`vendor-radix`、`vendor-tanstack`、`vendor-tauri`、`vendor-highlight-core`、`vendor-highlight-languages`

#### Scenario: chunk-init 在 Rolldown 下正确生成且不膨胀
- **WHEN** Rolldown 构建包含初始化 UI 组件和 initSteps 配置
- **THEN** 这些模块 MUST 归入 `chunk-init`，且 chunk-init MUST NOT 包含 node_modules 中的 vendor 依赖（通过 `includeDependenciesRecursively: false` 和 priority 分组实现）

#### Scenario: highlight.js 语言分类在 Rolldown 下正确
- **WHEN** Rolldown 处理 highlight.js 的语言定义模块（路径格式从 `/lib/languages/` 变为 `/es/languages/`）
- **THEN** 预加载语言 MUST 归入 `vendor-highlight-core`，非预加载语言 MUST 归入 `vendor-highlight-languages`

## ADDED Requirements

### Requirement: advancedChunks 分组优先级配置
Rolldown 的 `advancedChunks` 与 Rollup 的 `manualChunks` 语义不同——`name` 函数返回值是"建议"而非"强制"。MUST 通过 `priority` 字段和 `includeDependenciesRecursively: false` 确保分包行为的确定性。

#### Scenario: vendor groups 优先于 chunk-init 捕获 node_modules 模块
- **WHEN** 一个 node_modules 模块同时被 vendor group（priority: 8+）和 chunk-init group（priority: 1）的依赖链引用
- **THEN** 该模块 MUST 归入 vendor group 指定的 chunk，MUST NOT 被内联到 chunk-init

#### Scenario: includeDependenciesRecursively 阻止依赖内联
- **WHEN** `advancedChunks.includeDependenciesRecursively` 设置为 `false`
- **THEN** 一个 group 匹配的 src 模块所依赖的 node_modules 包 MUST NOT 被拉入该 group 的 chunk，而是按各自独立的 vendor group 分配
