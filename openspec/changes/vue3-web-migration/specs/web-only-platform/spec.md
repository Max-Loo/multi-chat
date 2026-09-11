# 纯 Web 平台能力规范（增量）

## Purpose

定义应用作为纯 Web 应用的平台约束：移除 Tauri 运行时、依赖与代码后，存储、密钥、HTTP、语言检测、外部链接等平台能力一律由 Web 标准 API 提供，构建产物为可直接部署的静态资源。

## ADDED Requirements

### Requirement: 纯 Web 运行时

应用 SHALL 仅由静态 Web 资源构成，可在现代浏览器中独立运行；项目 SHALL NOT 包含 Tauri 运行时依赖（`@tauri-apps/*`、`tauri-plugin-*`）、Rust 后端（`src-tauri/`）或 Tauri 配置文件。

#### Scenario: 开发启动

- **WHEN** 开发者执行 `pnpm dev`
- **THEN** 应用经 Vite 开发服务器启动并在浏览器中可用
- **AND** 全程不涉及 Tauri CLI 或桌面容器

#### Scenario: 生产构建

- **WHEN** 开发者执行 `pnpm build`
- **THEN** 构建产出可部署到任意静态站点的 `dist/` 目录
- **AND** 产物中不包含 `window.__TAURI__` 探测或 Tauri 插件代码

#### Scenario: 仓库内容

- **WHEN** 检查仓库结构
- **THEN** 不存在 `src-tauri/` 目录、`tauri.conf.json` 及 `@tauri-apps/*` 依赖声明

### Requirement: 平台能力由 Web 标准 API 提供

所有平台能力 SHALL 由 Web 标准 API 实现：数据持久化使用 IndexedDB，密钥安全存储使用 Web Crypto（IndexedDB + AES-256-GCM），HTTP 请求使用原生 fetch，语言检测使用 `navigator.language`，打开外部链接使用 `window.open`。

#### Scenario: 打开外部链接

- **WHEN** 用户点击指向外部站点的链接或按钮
- **THEN** 应用通过 `window.open` 在新标签页打开目标 URL

#### Scenario: 各平台能力无降级分支

- **WHEN** 调用存储、密钥、HTTP、语言检测等平台能力
- **THEN** 实现路径唯一（Web 标准 API），不存在按运行环境选择实现的双分支逻辑

### Requirement: 环境检测收缩

应用 SHALL NOT 包含 `isTauri()` 检测、`window.__TAURI__` 探测或任何以"Tauri 环境"为条件的运行分支；仅保留开发/生产环境区分（`import.meta.env.DEV`）与测试环境区分。

#### Scenario: 无双环境探测

- **WHEN** 在源码中检索 `isTauri` 或 `__TAURI__`
- **THEN** 不存在任何匹配项

#### Scenario: 既有业务分支收敛

- **WHEN** 检查迁移前按 `isTauri()` 分叉的业务逻辑（如重置数据、主密钥读写）
- **THEN** 仅保留 Web 实现路径，行为与迁移前 Web 环境下的表现一致

### Requirement: 构建脚本语义

`package.json` 脚本 SHALL 直接对应 Vite 工作流：`dev`/`build`/`preview` 分别对应开发、生产构建与本地预览；SHALL NOT 保留 `tauri` 相关脚本与 `web:*` 别名（`web:dev`、`web:build`）。

#### Scenario: 脚本统一

- **WHEN** 开发者查看或执行 `package.json` 的 `dev`、`build`、`preview` 脚本
- **THEN** 三个脚本分别启动 Vite 开发服务器、执行生产构建、本地预览构建产物
- **AND** `tauri`、`web:dev`、`web:build` 脚本不再存在

### Requirement: 生产环境网络约束

应用 SHALL 不假设存在可绕过浏览器同源策略的请求通道；生产环境下对 AI 供应商 API 的直连请求受浏览器 CORS 约束，开发环境继续通过 Vite 代理解决跨域。

#### Scenario: 开发环境跨域

- **WHEN** 在开发环境中请求配置了 Vite 代理的 AI 供应商 API
- **THEN** 请求经代理转发成功，与迁移前开发行为一致

#### Scenario: 生产构建不含原生请求通道

- **WHEN** 审查生产构建产物
- **THEN** 不存在依赖桌面容器能力的请求实现
- **AND** 供应商 API 请求使用原生 fetch，其可达性由目标服务的 CORS 策略决定
