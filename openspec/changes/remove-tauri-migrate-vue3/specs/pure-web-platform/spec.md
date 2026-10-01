# Spec Delta：pure-web-platform（新能力）

## Purpose

定义应用在移除 Tauri 后的纯 Web 运行时契约：应用仅以浏览器 Web 应用形态构建、分发与运行，网络、外链、语言检测、持久化等平台能力仅依赖浏览器标准 API，既有用户数据保持兼容。

## ADDED Requirements

### Requirement: 纯 Web 运行形态

系统 SHALL 仅以浏览器 Web 应用形态构建和运行：开发态为 Vite dev server，生产态为 Vite 构建产生的静态资源（`dist/`），不存在桌面安装包或桌面构建链路。

#### Scenario: 开发环境启动
- **WHEN** 开发者执行 `pnpm dev`
- **THEN** 系统通过 Vite dev server 启动应用，可在浏览器中访问
- **AND** 不需要 Rust 工具链或桌面容器

#### Scenario: 生产构建
- **WHEN** 开发者执行 `pnpm build`
- **THEN** 系统通过 Vite 产出静态站点到 `dist/`
- **AND** 产物可直接部署到静态托管（如 GitHub Pages）

#### Scenario: 无桌面构建链路
- **WHEN** 检查构建脚本与配置
- **THEN** 不存在 `tauri dev`/`tauri build` 等桌面构建入口
- **AND** 构建过程不依赖 `src-tauri/` 目录

### Requirement: 网络请求使用浏览器原生 fetch

系统 SHALL 使用浏览器原生 `fetch` 发起全部 HTTP 请求（AI 供应商对话请求、远程模型列表获取等），遵循标准 Fetch API 语义。

#### Scenario: AI 供应商对话请求
- **WHEN** 应用向 AI 供应商 API 发起对话请求
- **THEN** 请求通过浏览器原生 `fetch` 发出
- **AND** 请求受浏览器 CORS 语义约束（与既有 Web 版行为一致）

#### Scenario: 远程模型列表获取
- **WHEN** 应用从远程模型数据源获取模型列表
- **THEN** 请求通过浏览器原生 `fetch` 发出

#### Scenario: 网络请求失败
- **WHEN** 请求因网络错误失败
- **THEN** 系统按标准 Fetch API 语义抛出 `TypeError` 等原生错误
- **AND** 上层错误处理（重试、用户提示）行为与既有 Web 版一致

### Requirement: 外部链接打开

系统 SHALL 使用浏览器原生能力（新标签页）打开外部 URL，不依赖 Shell 命令。

#### Scenario: 点击外部链接
- **WHEN** 用户触发打开外部链接的操作（如供应商官网、文档链接）
- **THEN** 系统通过 `window.open` 在新标签页打开该 URL
- **AND** 不执行任何本地命令

### Requirement: 语言检测

系统 SHALL 使用 `navigator.language` 作为系统语言的唯一来源，用户在应用内手动选择的语言（持久化于 localStorage）优先级更高。

#### Scenario: 首次启动语言检测
- **GIVEN** 用户首次访问且未手动设置过语言
- **WHEN** 应用初始化语言
- **THEN** 系统使用 `navigator.language` 作为初始语言
- **AND** 支持的语言命中应用语言包，未命中时回退到默认语言

#### Scenario: 用户手动设置语言优先
- **GIVEN** 用户已在设置中手动选择语言
- **WHEN** 应用初始化语言
- **THEN** 系统使用用户选择的语言，而非 `navigator.language`

### Requirement: 数据持久化唯一路径与数据兼容

系统 SHALL 仅依赖浏览器存储（IndexedDB + localStorage）进行数据持久化，且数据库名称、对象存储与记录格式与既有 Web 版保持一致，确保既有用户数据在本次变更后仍可读写。

#### Scenario: 既有数据直接可用
- **GIVEN** 用户在既有 Web 版中已有聊天记录、模型配置、密钥数据
- **WHEN** 用户在本变更发布后的版本中打开应用
- **THEN** 系统 SHALL 能读取既有聊天记录与模型配置
- **AND** keyring 仍使用 `multi-chat-keyring` 数据库与 localStorage 种子键 `multi-chat-keyring-seed`
- **AND** store 仍使用 `multi-chat-store` 数据库
- **AND** 不发生数据丢失或强制重置

#### Scenario: 写入行为不变
- **WHEN** 应用写入新的聊天记录、模型配置或密钥数据
- **THEN** 存储位置与记录格式与既有 Web 版一致

### Requirement: 浏览器能力检测

系统 SHALL 以浏览器能力检测（IndexedDB、Web Crypto API 等是否可用）作为功能可用性的唯一判定依据，并在能力缺失时向用户呈现功能不可用提示。

#### Scenario: 能力完备的浏览器
- **GIVEN** 浏览器支持 IndexedDB 与 Web Crypto API
- **WHEN** 应用初始化存储与密钥功能
- **THEN** 相关功能全部可用

#### Scenario: 能力缺失的浏览器
- **GIVEN** 浏览器不支持 IndexedDB 或 Web Crypto API
- **WHEN** 应用初始化对应功能
- **THEN** 系统显示用户友好的"浏览器不支持"提示
- **AND** 不抛出未处理的运行时错误

### Requirement: 无 Tauri 运行时残留

系统 SHALL 不再包含任何 Tauri 运行时依赖与分支代码：不存在 `window.__TAURI__` 检测、Tauri 插件动态导入及原生实现分支；相关 npm 依赖完全移除且构建通过。

#### Scenario: 依赖移除
- **WHEN** 检查 `package.json` 与安装后的依赖树
- **THEN** 不包含 `@tauri-apps/*`、`tauri-plugin-keyring-api` 等任何 Tauri 相关依赖

#### Scenario: 代码路径收敛
- **WHEN** 检查前端源码
- **THEN** 不存在 `window.__TAURI__` 环境检测与 Tauri 插件导入
- **AND** 每项平台能力只有唯一的 Web 实现

#### Scenario: 构建与测试通过
- **WHEN** 执行 `pnpm build` 与 `pnpm test:run`
- **THEN** 构建与测试均成功，无因 Tauri 移除导致的失败
