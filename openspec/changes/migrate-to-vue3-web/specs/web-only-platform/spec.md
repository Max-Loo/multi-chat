# Spec Delta

## Purpose

定义项目收敛为纯 Web 运行时平台的行为要求：无桌面容器依赖、数据仅持久化于浏览器本地、开发与发布工作流仅保留 Web 渠道，消除双平台分支。

## ADDED Requirements

### Requirement: 纯浏览器运行时

应用 SHALL 仅在浏览器运行时中运行，构建产物为纯静态资源，可部署于任意静态文件服务器，不依赖任何桌面容器或系统级 API。

#### Scenario: 静态部署可运行

- **WHEN** 将构建产物（`dist/`）部署到任意静态服务器并访问
- **THEN** 应用完整运行，全部功能可用
- **AND** 产物中不包含任何桌面运行时代码

#### Scenario: 无桌面专属能力调用

- **WHEN** 检视运行时代码的全部平台能力调用
- **THEN** 不存在系统钥匙串、本地命令执行、桌面文件存储等桌面专属调用
- **AND** 项目依赖清单中不存在任何 Tauri 相关包

### Requirement: 数据仅持久化于浏览器本地

应用全部持久化数据 SHALL 仅存于浏览器本地：结构化数据存于 IndexedDB（`multi-chat-store`、`multi-chat-keyring`），轻量配置存于 localStorage，库结构与键名与迁移前完全一致。

#### Scenario: 数据落点不变

- **WHEN** 应用保存聊天、模型或密钥数据
- **THEN** 数据写入迁移前相同的 IndexedDB 库/对象存储与 localStorage 键
- **AND** 迁移前的既有浏览器数据无需任何转换即可直接读取

#### Scenario: 存储能力不可用的降级

- **WHEN** 浏览器不支持 IndexedDB 或 Web Crypto API
- **THEN** 系统显示友好的浏览器不支持提示
- **AND** 应用不崩溃

### Requirement: 网络请求统一使用原生 fetch

应用全部网络请求（模型数据拉取、AI 服务调用）SHALL 通过浏览器原生 `fetch` 发起，不经过任何中间运行时转接。

#### Scenario: 直接发起网络请求

- **WHEN** 应用向模型服务 API 发起请求
- **THEN** 请求由浏览器原生 `fetch` 直接发出并返回标准 Response

### Requirement: 外部链接于新标签页打开

应用内的外部链接 SHALL 始终在浏览器新标签页以 `noopener` 方式打开，不尝试调用系统 shell。

#### Scenario: 点击外部链接

- **WHEN** 用户点击应用内的外部站点链接
- **THEN** 浏览器在新标签页打开目标地址
- **AND** 打开的页面无法通过 `window.opener` 反向操控应用页面

### Requirement: 开发与构建工作流仅保留 Web 渠道

项目的默认开发、构建、发布脚本 SHALL 仅保留纯 Web 工作流，桌面构建入口与流水线移除。

#### Scenario: 开发服务器启动

- **WHEN** 开发者运行默认开发命令
- **THEN** 系统启动纯 Web 开发服务器并提供既有的 API 代理配置

#### Scenario: 生产构建

- **WHEN** 开发者运行默认构建命令
- **THEN** 系统产出纯静态资源到 `dist/` 目录

#### Scenario: 桌面构建入口不存在

- **WHEN** 开发者检视 npm 脚本与 CI 工作流
- **THEN** 不存在任何 Tauri/桌面构建命令或流水线
