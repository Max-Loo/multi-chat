# Spec Delta

## Purpose

定义应用移除 Tauri 后作为纯 Web 应用的运行时要求：依赖约束、浏览器 API 使用边界、纯静态构建与部署形态，以及桌面分发终止带来的对外行为变化。

## ADDED Requirements

### Requirement: 无 Tauri 依赖

项目 SHALL 完全移除 Tauri 相关依赖与代码：`package.json` 不含 `@tauri-apps/*`、`@tauri-apps/cli`、`tauri-plugin-*` 依赖；仓库不含 `src-tauri/` 目录与 Tauri 配置文件；代码中不存在 Tauri 插件的动态导入或 `window.__TAURI__` 检测。

#### Scenario: 依赖清单清洁

- **WHEN** 检查 `package.json` 的 dependencies 与 devDependencies
- **THEN** 不存在任何 `@tauri-apps` 作用域包或 `tauri-plugin-*` 包
- **AND** 构建产物中不引用任何 Tauri 运行时

#### Scenario: 源码无 Tauri 分支

- **WHEN** 在 `src/` 内全局搜索 Tauri 插件导入与 `__TAURI__`
- **THEN** 无任何匹配
- **AND** 原"按环境选择原生实现/降级实现"的双分支逻辑被移除，仅保留 Web 实现

### Requirement: 仅浏览器 API 运行时

应用运行时 SHALL 仅依赖浏览器标准 API：数据持久化仅使用 IndexedDB 与 `localStorage`；HTTP 请求仅使用浏览器原生 `fetch`；界面语言检测仅使用 `navigator.language`；打开外部链接仅使用 `window.open`。

#### Scenario: 持久化仅浏览器存储

- **WHEN** 应用持久化任何数据（模型列表、聊天记录、密钥、设置）
- **THEN** 数据 SHALL 仅写入 IndexedDB 或 `localStorage`
- **AND** 不尝试访问任何文件系统或系统级存储

#### Scenario: 网络请求受浏览器安全模型约束

- **WHEN** 应用从浏览器向模型供应商 API 发起请求
- **THEN** 请求 SHALL 经由浏览器原生 `fetch` 发出
- **AND** 受浏览器 CORS 策略约束；跨域失败时按现有错误处理流程提示用户，不出现未捕获异常

### Requirement: 纯静态构建与部署

构建产物 SHALL 为可静态托管的纯 Web 应用：`pnpm build`（或等价命令）产出 `dist/` 静态资源；构建 SHALL 支持 `BASE_PATH` 环境变量以适配子路径部署（如 GitHub Pages）；现有 gh-pages 自动部署流程 SHALL 继续可用。

#### Scenario: 构建产出静态资源

- **WHEN** 执行生产构建
- **THEN** `dist/` 仅包含 HTML、JS、CSS 与静态资产
- **AND** 不产出任何桌面安装包或平台二进制

#### Scenario: 子路径部署

- **WHEN** 以 `BASE_PATH=/multi-chat/` 执行构建并部署到 gh-pages
- **THEN** 应用资源引用与路由 base 正确匹配子路径
- **AND** 应用可正常加载与运行

### Requirement: 开发与构建命令收敛

package.json 脚本 SHALL 收敛为纯 Web 工作流：`dev` 与 `build` 直接映射到 Vite 命令；不再存在 `tauri`、`web:dev`、`web:build:tauri` 等双轨脚本。

#### Scenario: 脚本清理

- **WHEN** 检查 `package.json` 的 scripts
- **THEN** 不存在 `tauri` 相关命令
- **AND** `dev` 与 `build` 为唯一的开发/生产构建入口

### Requirement: 桌面分发终止

系统 SHALL 停止发布与维护 Tauri 桌面安装包；桌面端本地数据（Tauri 本地存储与系统钥匙串中的密钥）SHALL 不做自动迁移，用户可继续使用既有的密钥导出/导入功能手动迁移。

#### Scenario: 不再产出桌面安装包

- **WHEN** 执行完整发布流程
- **THEN** 发布产物仅包含 Web 部署内容
- **AND** 不生成 macOS/Windows/Linux 桌面安装包

#### Scenario: 桌面用户数据不自动迁移

- **WHEN** 原桌面版用户转为使用 Web 版
- **THEN** 系统 SHALL 不尝试访问桌面端本地数据
- **AND** 用户可通过密钥导出文件与数据导出功能手动迁移（能力保留，见现有导出相关规范）
