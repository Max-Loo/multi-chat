# OS 插件 locale() API Web 兼容层规范

本规范定义了 `@tauri-apps/plugin-os` 的 `locale()` API 在 Web 环境中的兼容层要求。

## ADDED Requirements

### Requirement: locale() 兼容层

系统 SHALL 为 `@tauri-apps/plugin-os` 的 `locale()` API 提供 Web 兼容层，在 Tauri 和 Web 环境中均可用。

#### Scenario: Tauri 环境使用原生实现
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用兼容层的 `locale()` 函数
- **THEN** 系统调用 `@tauri-apps/plugin-os` 的原生 `locale()` 实现
- **AND** 返回系统语言设置（如 "zh-CN"、"en-US"）

#### Scenario: Web 环境使用浏览器实现
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用兼容层的 `locale()` 函数
- **THEN** 系统返回 `navigator.language` 的值
- **AND** 返回浏览器语言设置（如 "zh-CN"、"en-US"）

#### Scenario: 返回值格式一致性
- **WHEN** 在任一环境调用 `locale()` 函数
- **THEN** 返回值格式为 BCP 47 语言标签（language-script-region）
- **AND** 与 `@tauri-apps/plugin-os` 原生 API 返回格式一致

### Requirement: 浏览器语言检测

在 Web 环境中，系统 SHALL 使用浏览器原生 API 获取语言设置，作为 `locale()` 的降级实现。

#### Scenario: 使用 navigator.language
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用兼容层的 `locale()` 函数
- **THEN** 系统返回 `navigator.language` 的值
- **AND** 该值反映浏览器的首选语言设置

#### Scenario: 浏览器语言与系统语言差异
- **GIVEN** 用户浏览器语言与操作系统语言不同
- **WHEN** 在 Web 环境调用 `locale()` 函数
- **THEN** 系统返回浏览器语言（非系统语言）
- **AND** 用户可通过应用设置手动调整语言（localStorage 优先级更高）

### Requirement: 平台检测替换

系统 SHALL 移除 `@tauri-apps/plugin-os` 的 `platform()` API 使用，改为通过浏览器 UserAgent 检测平台信息。

#### Scenario: 移除 platform() 导入
- **GIVEN** 代码中使用 `@tauri-apps/plugin-os` 的 `platform()` 函数
- **WHEN** 实施兼容层变更
- **THEN** 系统移除对 `platform()` 的导入和调用
- **AND** 使用浏览器 UserAgent 检测逻辑替代

#### Scenario: 检测 macOS Safari 浏览器
- **GIVEN** 应用需要检测是否为 macOS 平台的 Safari 浏览器
- **WHEN** 调用平台检测逻辑
- **THEN** 系统通过 `navigator.userAgent` 检测浏览器和操作系统
- **AND** 返回是否为 macOS Safari 的布尔值

#### Scenario: UserAgent 检测逻辑
- **WHEN** 实现浏览器平台检测
- **THEN** 系统检查 userAgent 中是否包含 "Mac" 或 "macOS"
- **AND** 检查是否包含 "Safari" 且不包含 "Chrome"、"Edge"、"Firefox"
- **AND** 返回正确的检测结果

### Requirement: 类型安全

兼容层 SHALL 在 TypeScript 编译时保持类型安全，确保与原生 API 类型一致。

#### Scenario: 编译时类型检查
- **GIVEN** 项目使用 TypeScript 严格模式
- **WHEN** 导入和使用兼容层的 `locale()` 函数
- **THEN** TypeScript 编译器不报类型错误
- **AND** 函数签名与 `@tauri-apps/plugin-os` 的 `locale()` 一致
- **AND** 返回类型为 `string`

#### Scenario: 类型定义复用
- **WHEN** 定义兼容层类型
- **THEN** 系统复用 `@tauri-apps/plugin-os` 的官方类型定义
- **AND** 不创建重复的类型声明

### Requirement: 环境检测

兼容层 SHALL 在运行时检测当前环境，选择合适的实现。

#### Scenario: Tauri 环境检测
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用 `isTauri()` 环境检测函数
- **THEN** 函数返回 `true`
- **AND** 兼容层选择 Tauri 原生实现

#### Scenario: Web 环境检测
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `isTauri()` 环境检测函数
- **THEN** 函数返回 `false`
- **AND** 兼容层选择浏览器降级实现

#### Scenario: 环境检测实现
- **WHEN** 实现 `isTauri()` 函数
- **THEN** 系统通过检测 `window.__TAURI__` 对象的存在性判断环境
- **AND** 不依赖编译时环境变量

### Requirement: 导入路径规范

项目代码 SHALL 使用兼容层的统一导入路径，而非直接导入 Tauri 插件。

#### Scenario: 正确的 locale() 导入
- **WHEN** 在项目代码中需要获取系统语言
- **THEN** 使用 `import { locale } from '@/utils/tauriCompat'`
- **AND** 不使用 `import { locale } from '@tauri-apps/plugin-os'`

#### Scenario: 导入路径别名
- **WHEN** 配置 TypeScript 路径别名
- **THEN** `@/` 别名指向 `src/` 目录
- **AND** 兼容层路径为 `@/utils/tauriCompat`

### Requirement: 向后兼容性

兼容层 SHALL 保持完全向后兼容，不破坏现有的 Tauri 桌面功能。

#### Scenario: Tauri 环境功能不变
- **GIVEN** 代码库中已有使用 `@tauri-apps/plugin-os` 的 `locale()` 的代码
- **WHEN** 引入兼容层并更新导入路径
- **THEN** Tauri 环境的功能行为保持不变
- **AND** 返回值与原生 API 完全一致

#### Scenario: Tauri 环境性能
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 通过兼容层调用 `locale()` API
- **THEN** 性能与直接使用原生 API 相当
- **AND** 兼容层引入的性能开销可忽略不计

### Requirement: 不抛出异常

在 Web 环境中，兼容层 SHALL 不抛出运行时错误，始终返回有效的语言标签。

#### Scenario: Web 环境 locale() 不抛异常
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用兼容层的 `locale()` 函数
- **THEN** 函数不抛出运行时错误
- **AND** 始终返回有效的字符串（`navigator.language` 或其值）

#### Scenario: navigator.language 可用性
- **GIVEN** 应用运行在现代 Web 浏览器环境
- **WHEN** 调用 `locale()` 函数
- **THEN** `navigator.language` API 始终可用
- **AND** 不需要额外的可用性检查

### Requirement: 模块化设计

兼容层 SHALL 使用模块化设计，便于维护和扩展。

#### Scenario: 目录结构
- **WHEN** 创建 OS 插件兼容层代码
- **THEN** 系统在 `src/utils/tauriCompat/` 目录下创建 `os.ts` 文件
- **AND** 在 `src/utils/tauriCompat/index.ts` 中导出 `locale()` 函数

#### Scenario: 单一职责原则
- **WHEN** 实现 OS 插件兼容层模块
- **THEN** `os.ts` 只包含 OS 插件的兼容逻辑
- **AND** 不包含其他插件或功能的兼容代码

#### Scenario: 可扩展性
- **WHEN** 未来需要为其他 OS 插件 API（如 `version()`, `arch()`）添加兼容层
- **THEN** 系统在 `os.ts` 中添加新函数
- **AND** 保持与 `locale()` 相同的设计模式

### Requirement: 代码规范

兼容层代码 SHALL 遵循项目的代码规范和最佳实践。

#### Scenario: 中文注释
- **WHEN** 编写兼容层代码
- **THEN** 所有函数、变量使用中文注释
- **AND** JSDoc 注释使用中文描述

#### Scenario: 无额外依赖
- **WHEN** 实现 OS 插件兼容层
- **THEN** 不引入新的 npm 运行时依赖
- **AND** 仅使用项目已有的依赖（如 `@tauri-apps/plugin-os`）

#### Scenario: KISS 和 DRY 原则
- **WHEN** 实现兼容层
- **THEN** 代码保持简洁，避免不必要的抽象
- **AND** 复用现有的 `isTauri()` 环境检测函数

### Requirement: 文档更新

系统 SHALL 更新项目文档，说明 OS 插件 locale() 的 Web 兼容模式。

#### Scenario: AGENTS.md 更新
- **WHEN** 实现 OS 插件兼容层后
- **THEN** 在 AGENTS.md 的"跨平台兼容性"章节中添加 OS 插件兼容层说明
- **AND** 包含以下内容：
  - locale() 兼容层的用途和实现方式
  - 如何在代码中使用兼容层 API
  - Web 环境使用浏览器语言的行为说明
  - 平台检测逻辑的替换说明

#### Scenario: 导入路径规范说明
- **WHEN** 文档提及 OS 插件兼容层
- **THEN** 明确说明使用 `@/utils/tauriCompat` 导入
- **AND** 提供代码示例

### Requirement: 测试验证

系统 SHALL 在两种环境中验证兼容层的正确性。

#### Scenario: Tauri 环境验证
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 执行功能测试
- **THEN** 验证兼容层调用原生 API 成功
- **AND** `locale()` 返回正确的系统语言
- **AND** 应用初始化语言正确

#### Scenario: Web 环境验证
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 执行功能测试
- **THEN** 验证兼容层不抛出运行时错误
- **AND** `locale()` 返回浏览器语言
- **AND** 应用正常加载和运行

#### Scenario: Safari 平台检测验证
- **GIVEN** 应用运行在 macOS Safari 浏览器
- **WHEN** 测试中文输入法场景
- **THEN** 验证平台检测逻辑正确识别 macOS Safari
- **AND** 中文输入法 bug 处理逻辑正常工作

#### Scenario: 构建流程验证
- **WHEN** 执行 `pnpm tauri dev` 和 `pnpm web:dev`
- **THEN** 两种构建流程均成功
- **AND** 不出现 TypeScript 类型错误
- **AND** 不出现运行时错误
