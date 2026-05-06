## MODIFIED Requirements

### Requirement: 测试辅助工具路径别名

系统 SHALL NOT 配置 `@/test-helpers` 路径别名。测试辅助工具统一通过 `@/__test__/helpers` 路径导入，该路径通过 `@/` → `src/` 别名自然解析。

#### Scenario: vite.config.ts 不包含 @/test-helpers 别名

- **WHEN** 检查 `vite.config.ts` 的 `resolve.alias` 配置
- **THEN** 不存在 `@/test-helpers` 或 `@/test-helpers/*` 的别名定义

#### Scenario: tsconfig.json 不包含 @/test-helpers 路径映射

- **WHEN** 检查 `tsconfig.json` 的 `compilerOptions.paths` 配置
- **THEN** 不存在 `@/test-helpers` 或 `@/test-helpers/*` 的路径映射

#### Scenario: 测试文件使用 @/__test__/helpers 导入

- **WHEN** 测试文件需要导入测试辅助工具
- **THEN** 使用 `import { ... } from '@/__test__/helpers/...'` 路径
- **AND** 路径通过 `@/` → `src/` 别名正确解析到 `src/__test__/helpers/...`

## REMOVED Requirements

### Requirement: 全局测试辅助工具导入

**Reason**：原要求指定通过 `@/test-helpers/assertions` 导入，但该别名从未工作。实际实现通过 `@/__test__/helpers/assertions` 路径导入，功能相同。

**Migration**：此要求已被上方的"测试辅助工具路径别名"修改要求替代，实际导入路径为 `@/__test__/helpers/...`。
