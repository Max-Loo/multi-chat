# Proposal

## Why

项目当前以「Tauri 桌面 + Web」双栈形态维护，但 Tauri 依赖面已全部收敛在 `src/utils/tauriCompat/` 兼容层内（无自定义 Rust 命令、无 `invoke()` 调用），Web 降级实现（IndexedDB 存储、Web Crypto 加密、原生 fetch、`navigator.language`）全部就绪，桌面壳仅剩「plugin-http 绕 CORS、系统钥匙串、本地 shell 命令」三项增量能力。双栈导致框架升级、测试矩阵、CI 流水线与文档同步成本翻倍。将前端一次性迁移到 Vue 3（组合式 API）并移除 Tauri，可收敛为单一纯 Web 技术栈，消除全 codebase 的双环境分支逻辑，显著降低长期维护成本。

## What Changes

- **BREAKING** 移除桌面端发行：删除 `src-tauri/` 目录、`@tauri-apps/*` 与 `tauri-plugin-keyring-api` 依赖、Tauri 相关脚本（`tauri dev` / `tauri build`）与桌面构建 CI workflow。应用此后仅以浏览器 SPA 形式构建与分发（GitHub Pages）。
- **BREAKING** 前端框架由 React 19 迁移至 Vue 3（组合式 API + `<script setup>`）：`components/`、`pages/`、`hooks/` 全量重写为 Vue 组件与组合式函数；`react-router-dom` → `vue-router`；`react-i18next` → i18next 的 Vue 绑定（i18next 核心与语言资源保留）；Redux Toolkit → Pinia；Radix UI / shadcn → shadcn-vue（reka-ui）；React Testing Library → Vue Test Utils。
- `src/utils/tauriCompat/` 兼容层降维为纯浏览器平台服务层：HTTP 恒用原生 fetch；keyring / store 仅保留 IndexedDB 实现；本地 shell 命令能力移除，外链打开改用 `window.open`；目录更名以摆脱 Tauri 命名。
- 既有 Web 用户数据兼容：Vue 版 SHALL 直接读写现有 IndexedDB 库（`multi-chat-store`、`multi-chat-keyring`）与全部 localStorage 键，无需数据迁移。
- 安全提示文案调整：移除「建议在桌面版中处理敏感数据」等以桌面版为对照的表述，改为说明 Web 存储的安全级别与密钥导出建议。
- 已知限制（非目标）：生产环境 LLM API 直连受浏览器 CORS 约束（现状 gh-pages 版本同样受限，开发环境沿用 Vite 代理）；不提供桌面版数据迁移工具（桌面版数据为 plugin-store JSON 文件，无法从浏览器访问）。

## Capabilities

### New Capabilities

- `vue3-frontend`: Vue 3（组合式 API）前端架构与迁移兼容性要求——技术栈约束、URL 路由结构兼容、既有用户数据免迁移兼容、状态管理（Pinia）与持久化行为等价、i18n 行为等价（保留 i18next 核心）、UI 组件库等价替换、测试栈迁移与行为测试约定延续。

### Modified Capabilities

- `http-fetch-compat`: 移除「生产环境 Tauri 平台使用 Tauri Fetch」与环境检测中的 Tauri 判定（`window.__TAURI__`）；`fetch` 恒为原生 Web Fetch，`getFetchFunc` 语义不变。
- `web-keyring-compat`: 移除 Tauri 系统钥匙串分支，IndexedDB + AES-256-GCM 实现成为唯一实现；调整引用桌面版的安全警告文案；导入路径随平台层目录更名同步。
- `web-store-compat`: 移除 Tauri plugin-store 分支，IndexedDB 实现成为唯一实现；移除「Tauri 端数据类型一致性」对照场景；导入路径随平台层目录更名同步。
- `gh-pages-auto-deployment`: 移除「与桌面应用构建并行触发、版本号同步」要求；Web 构建成为唯一构建与发布产物，构建脚本由 `web:build` 收敛为主 `build`。

## Impact

- **代码**：`src/` UI 层全量重写（components 50 文件、pages 49、hooks 16 → Vue 组件 / 组合式函数）；`src/store/` 18 个 Redux 文件 → Pinia store（持久化逻辑等价迁移）；框架无关层保留复用（`services/chat/`、`services/modelRemote/`、i18n 核心逻辑、`utils/crypto.ts` 等）；`src/utils/tauriCompat/` 10 文件收敛并更名。
- **依赖**：移除 react / react-dom / @reduxjs/toolkit / react-redux / react-router-dom / react-i18next / @radix-ui/* / @tanstack/react-* / @tauri-apps/* / tauri-plugin-keyring-api 等约 25 项；新增 vue / pinia / vue-router / shadcn-vue 系 / vue-i18n 绑定等；保留 ai、i18next、tailwindcss v4、vitest、virtua（Vue 版）、dayjs、markdown-it 等框架无关依赖。
- **测试**：`src/__test__/` 178 个测试文件中组件 / hooks / pages 类（约 60+）作废并按 Vue Test Utils 重写；服务层与工具层测试保留并适配 mock 导入路径；Stryker mutate 清单与覆盖率排除清单更新。
- **构建 / CI**：`vite.config.ts`（React 插件与 React Compiler → Vue 插件、manualChunks 的 vendor-react / vendor-tauri 分包重写、Tauri 端口与 watch 约定移除）；`tsconfig.json` jsx 选项；`.oxlintrc.json` react 插件 → vue 插件；`scripts/update-version.js` 版本同步三处 → 一处；`.github/workflows` 桌面构建 workflow 删除。
- **文档**：AGENTS.md（技术栈、开发命令、架构描述）、README.md 与 README.zh-CN.md 双语同步、`docs/design/cross-platform.md` 重写为平台服务层说明、`docs/conventions/tauri-commands.md` 删除。
