# Spec Delta

## Purpose

定义移除 Tauri 桌面运行时后应用作为纯 Web 应用的运行要求：网络访问、密钥存储、外链跳转、语言检测、能力检测与静态部署形态。

## ADDED Requirements

### Requirement: 纯浏览器运行时

应用 SHALL 仅在现代浏览器中运行：代码库中不存在 Tauri 运行时（`src-tauri/` 目录）、`@tauri-apps/*` 与 `tauri-plugin-keyring-api` 依赖，以及运行时环境分支（`isTauri()` 类检测）；应用在支持 Web Crypto API 与 IndexedDB 的浏览器中完整可用。

#### Scenario: 仓库无 Tauri 残留
- **WHEN** 检查仓库文件与 `package.json` 依赖
- **THEN** 不存在 `src-tauri/` 目录与 Tauri 相关依赖
- **AND** 源码中不存在 `isTauri()` 等运行时环境分支逻辑

#### Scenario: 浏览器完整可用
- **GIVEN** 用户使用支持 Web Crypto API 与 IndexedDB 的现代浏览器（Chrome、Edge、Firefox、Safari 最新两个大版本）
- **WHEN** 访问应用
- **THEN** 聊天、模型管理、设置、数据加密存储等全部功能可用

#### Scenario: 不支持的浏览器给出提示
- **GIVEN** 用户使用不支持 Web Crypto API 或 IndexedDB 的旧版浏览器
- **WHEN** 访问应用
- **THEN** 系统显示升级浏览器的提示，不出现白屏或未捕获异常

### Requirement: 原生网络访问

应用的全部网络请求（远程模型数据获取、AI 供应商 API 调用）SHALL 使用浏览器原生 `fetch` API 发起，遵循浏览器同源策略与 CORS 规则；网络失败时错误 SHALL 以用户可理解的方式呈现。

#### Scenario: 远程模型数据获取
- **WHEN** 应用启动并获取 models.dev 远程模型数据
- **THEN** 请求通过原生 `fetch` 发起
- **AND** 失败时按既有缓存与重试机制降级，不中断应用启动

#### Scenario: AI 供应商 API 调用
- **WHEN** 用户发送消息触发流式聊天请求
- **THEN** 请求通过原生 `fetch` 发起并正确处理流式响应
- **AND** CORS 或网络错误以既有错误处理路径提示用户

### Requirement: 外部链接浏览器跳转

应用中打开外部链接（如官网、帮助文档）SHALL 通过浏览器原生能力（`window.open`）在新标签页打开。

#### Scenario: 打开外部链接
- **WHEN** 用户点击指向外部站点的链接或按钮
- **THEN** 浏览器在新标签页打开目标 URL
- **AND** 应用内不产生错误

### Requirement: 浏览器语言检测

系统的界面语言初始化 SHALL 依据浏览器 `navigator.language`（及 `navigator.languages` 列表）检测用户语言，并沿用既有的语言匹配与回退策略。

#### Scenario: 首次访问语言检测
- **GIVEN** 用户从未手动设置界面语言
- **WHEN** 用户首次访问应用
- **THEN** 界面语言依据 `navigator.language` 匹配支持语言（zh/en/fr）
- **AND** 无匹配时回退到默认语言，行为与迁移前 Web 环境一致

### Requirement: 浏览器能力检测

系统 SHALL 提供能力检测接口，供调用方判断密钥存储与数据持久化功能在当前浏览器中是否可用。

#### Scenario: 能力齐全
- **GIVEN** 浏览器支持 IndexedDB 与 Web Crypto API
- **WHEN** 调用密钥存储与数据持久化的能力检测
- **THEN** 检测结果为可用

#### Scenario: 能力缺失
- **GIVEN** 浏览器处于隐私模式导致 IndexedDB 不可用，或不支持 Web Crypto API
- **WHEN** 调用对应能力检测
- **THEN** 检测结果为不可用
- **AND** UI 层据此禁用相关功能或提示用户，不向用户暴露实现细节

### Requirement: 静态站点部署形态

应用 SHALL 构建为纯静态资源包，可部署至任意静态托管服务，GitHub Pages 自动部署流程作为正式发布渠道继续工作。

#### Scenario: 静态构建产物
- **WHEN** 执行生产构建
- **THEN** 产出纯静态资源（HTML、JS、CSS 与静态文件），无需服务器端运行时

#### Scenario: GitHub Pages 部署
- **WHEN** 触发既有的 GitHub Pages 自动部署流程
- **THEN** 部署成功且应用在 Pages 域名下完整可用（含子路径 BASE_PATH 场景）

#### Scenario: 刷新与深链接
- **GIVEN** 应用部署在静态托管服务上
- **WHEN** 用户直接访问或刷新带路由路径的 URL（如聊天详情页）
- **THEN** 应用正常加载并恢复到目标路由，不出现 404（借助 SPA 回退配置或 Hash 路由）
