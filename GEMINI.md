# Multi-Chat 项目上下文

## 项目概览
**Multi-Chat** 是一个基于 **Tauri 2.0** 和 **React 19** 构建的桌面 AI 客户端。它允许用户同时与多个 AI 模型聊天以对比回答。该应用强调数据隐私、可扩展的模型提供商支持以及现代化的 UI。

## 架构

### 前端 (React 19 + TypeScript)
- **状态管理:** Redux Toolkit，带有自定义中间件，用于将状态自动持久化到 Tauri 的 store 和 Stronghold 中。
- **路由:** React Router v7。
- **UI & 样式:** Ant Design + Ant Design X (AI 组件) + Tailwind CSS。
- **编译器:** 使用新的 React Compiler (`babel-plugin-react-compiler`)。
- **国际化 (I18n):** `i18next`，配合生成的 TypeScript 资源类型以确保类型安全。

### 后端 (Rust + Tauri 2.0)
- **插件:**
  - `tauri-plugin-store`: 用于通用设置和聊天历史。
  - `tauri-plugin-stronghold`: 使用 Argon2 加密安全存储 API 密钥。
  - `tauri-plugin-http`: 用于绕过 CORS 的网络请求。
- **数据路径:** 使用 `app_local_data_dir` 存储本地数据（如用于加密的 `salt.dat`）。

## 关键目录结构
- `src/lib/factory/`: 实现了模型提供商的工厂模式。`ProviderRegistry` 负责管理 DeepSeek、Kimi 和 OpenAI 等提供商的注册。
- `src/store/`: 集中式状态管理。
  - `slices/`: 特定功能的组件状态（模型、聊天、应用配置）。
  - `middleware/`: 拦截操作以触发副作用，如自动保存到磁盘。
  - `vaults/`: 封装了 Tauri 插件的底层数据访问层 (DAL)。
- `src/locales/`: JSON 翻译文件。修改后请运行 `pnpm generate-i18n-types`。

## 开发与构建

### 环境要求
- Node.js 18+ & pnpm
- Rust 1.70+

### 常用命令
| 命令 | 操作 |
| :--- | :--- |
| `pnpm dev` | 完整的 Tauri 开发环境（前端 + Rust）。 |
| `pnpm web:dev` | 仅前端开发（使用 Vite 代理进行 API 调用）。 |
| `pnpm build` | 为当前操作系统构建生产版本。 |
| `pnpm lint` | 使用 ESLint 进行代码检查。 |
| `pnpm test:run` | 执行 Vitest 单元测试。 |
| `pnpm generate-i18n-types` | 将 i18n JSON 键同步到 TS 类型。 |

### Vite 代理配置
在 `web:dev` 模式下，Vite 配置了代理以避免开发过程中的 CORS 问题：
- `/deepseek` -> `api.deepseek.com`
- `/kimi` -> `api.moonshot.cn`
- `/bigmodel` -> `open.bigmodel.cn`

## 代码规范

### 模式与实践
- **工厂模式:** 新的 AI 提供商必须通过 `src/lib/factory/modelProviderFactory` 添加。
- **Hooks 优先:** 将逻辑封装在自定义 Hooks 中（例如 `useBasicModelTable`）。
- **类型安全:** 使用来自 `@/store` 的 `RootState` 和 `AppDispatch` 类型。
- **安全导航:** 外部链接通过 `interceptClickAToJump` 拦截，并在系统浏览器中打开。

### Git 与提交
- 遵循现有的提交信息风格（简洁，关注“为什么”）。
- 在提交前确保 `pnpm lint` 通过。

## 测试标准
- **框架:** Vitest 配合 `jsdom`。
- **设置:** 在 `src/__tests__/setup.ts` 中进行全局 Mock。
- **覆盖率:** 目标是对核心逻辑（slices、factories、utils）实现 >90% 的覆盖率。