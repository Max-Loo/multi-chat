# Spec Delta

## Purpose

定义应用作为纯 Web 端项目运行的约束：零桌面运行时依赖、构建产物形态、CORS 处理策略、浏览器能力基线与数据驻留要求，确保移除 Tauri 后应用在浏览器环境中可构建、可部署、可安全运行。

## ADDED Requirements

### Requirement: 零桌面运行时依赖

项目 SHALL 不包含任何 Tauri 桌面运行时依赖。

#### Scenario: 依赖清单不含 Tauri

- **WHEN** 检查 `package.json` 的 dependencies 与 devDependencies
- **THEN** 不存在 `@tauri-apps/*`、`tauri-plugin-*`、`@tauri-apps/cli` 等任何 Tauri 相关依赖

#### Scenario: 源码不含 Tauri 引用

- **WHEN** 在 `src/` 目录全文检索 `@tauri-apps`、`__TAURI__`、`invoke(`
- **THEN** 无任何匹配结果

#### Scenario: Rust 后端目录不存在

- **WHEN** 检查项目根目录
- **THEN** 不存在 `src-tauri/` 目录

### Requirement: 构建与部署

项目 SHALL 以 Vite 作为唯一构建工具，产物为可直接部署的静态 SPA。

#### Scenario: 开发与构建命令

- **WHEN** 开发者运行 `pnpm dev` 或 `pnpm build`
- **THEN** 分别启动 Vite 开发服务器、产出 `dist/` 静态资源
- **AND** 命令行为与迁移前的 `web:dev`、`web:build` 一致，不再经由 Tauri CLI

#### Scenario: GitHub Pages 部署

- **WHEN** 运行 `pnpm deploy:gh-pages`
- **THEN** 以子路径 base 构建产物并发布到 GitHub Pages
- **AND** 部署后应用在子路径 URL 下正常加载与路由

#### Scenario: 无桌面构建入口

- **WHEN** 检查 `package.json` scripts
- **THEN** 不存在 `tauri`、`tauri dev`、`tauri build` 相关脚本

### Requirement: CORS 处理策略

系统 SHALL 按环境区分处理 AI 供应商 API 的跨域请求。

#### Scenario: 开发环境代理转发

- **WHEN** 开发环境中前端请求供应商 API（DeepSeek、Moonshot、智谱等）
- **THEN** 请求经 Vite 开发服务器 proxy 转发到对应供应商域名
- **AND** 浏览器不产生 CORS 错误

#### Scenario: 生产环境直连

- **WHEN** 生产环境中前端请求供应商 API
- **THEN** 使用浏览器原生 fetch 直连供应商端点
- **AND** 不依赖任何本地代理或桌面端转发

### Requirement: 浏览器能力基线

应用 SHALL 声明并检测必需的浏览器能力（IndexedDB、Web Crypto API、localStorage）。

#### Scenario: 能力缺失时友好报错

- **GIVEN** 浏览器不支持 IndexedDB 或 Web Crypto API（如部分隐私模式）
- **WHEN** 应用启动初始化
- **THEN** 系统显示用户友好的错误界面，说明浏览器能力不足
- **AND** 不出现未捕获的运行时异常或白屏

#### Scenario: 主流浏览器正常运行

- **GIVEN** 最新版 Chrome、Edge、Firefox 或 Safari
- **WHEN** 访问应用并执行聊天、模型管理、设置操作
- **THEN** 数据持久化、加密解密、流式响应均正常工作

### Requirement: 数据驻留浏览器

所有用户数据 SHALL 仅存储于用户浏览器的本地存储，无服务端存储。

#### Scenario: 数据存储位置

- **WHEN** 用户使用应用产生数据（模型配置、聊天记录、密钥种子、界面偏好）
- **THEN** 数据仅写入 IndexedDB（`multi-chat-store`、`multi-chat-keyring`）与 localStorage
- **AND** 不向任何服务器上传用户数据或聊天内容

#### Scenario: 主密钥手动导入导出

- **WHEN** 用户需要跨设备或跨浏览器迁移加密数据
- **THEN** 系统提供主密钥导出与导入功能
- **AND** 导入时通过既有数据解密验证密钥匹配性，不匹配时明确报错
