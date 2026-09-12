**中文** | [English](./README.md)

# Multi-Chat

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://max-loo.github.io/multi-chat/)
[![Deploy to GitHub Pages](https://github.com/Max-Loo/multi-chat/actions/workflows/deploy-to-gh-pages.yml/badge.svg)](https://github.com/Max-Loo/multi-chat/actions/workflows/deploy-to-gh-pages.yml)

基于 Vue 3 + TypeScript 构建的多模型聊天 Web 应用，支持同时与多个 AI 模型对话，方便对比回复。

## 功能特性

### 🤖 多模型支持

- 添加多个供应商的 AI 模型（如 DeepSeek、月之暗面等）
- 为每个模型配置独立的 API 密钥和地址
- 启用/禁用模型管理
- 模型配置安全本地存储
- 🔌 **远程模型数据**：从 `models.dev API` 动态获取模型供应商定义，保持数据最新
- ⚡ **性能优化**：供应商 SDK 懒加载，初始包体积减少约 125KB（gzip 后）

### 💬 多模型同时聊天

- 创建聊天会话，同时与多个模型对话
- 向多个模型发送同一问题，并排对比回复
- 实时流式响应展示
- 可中断进行中的对话

### 📝 聊天管理

- 创建、编辑、删除聊天会话
- 聊天历史持久化存储
- 搜索和过滤聊天会话
- 可折叠侧边栏设计，节省空间

### 🎨 现代化 UI

- 基于 shadcn-vue（reka-ui）组件库的现代 UI 设计
- **四级响应式布局系统**，自动适配不同屏幕尺寸
- 可自定义聊天窗口布局（单栏/多栏显示）
- 流畅的动画与过渡效果

### 📱 响应式布局

应用支持四级响应式布局，根据窗口宽度自动调整：

- **Desktop**（≥1280px）：完整桌面布局，224px 侧边栏
- **Compressed**（1024-1279px）：压缩布局，192px 侧边栏（更小的字体和图标）
- **Compact**（768-1023px）：紧凑布局，192px 侧边栏（更小的字体和图标）
- **Mobile**（<768px）：移动端布局
  - 侧边栏整合进抽屉（从左侧滑出）
  - 底部导航栏（聊天/模型/设置）
  - 触摸优化的交互

**技术特性**：
- 窗口尺寸变化时自动平滑切换（150ms 防抖）
- 平滑的 CSS 过渡动画
- 完整的键盘导航与 ARIA 标签支持

### 🔒 数据安全

- 本地数据存储，保护隐私
- API 密钥使用 AES-256-GCM 加密
- 主密钥通过 Web Crypto + IndexedDB 存储在浏览器中
- 敏感数据字段级加密，非敏感数据明文存储
- 数据以 JSON 格式存储，便于备份与检查

## 技术栈

- **前端框架**：Vue 3（组合式 API）+ TypeScript
- **UI 组件**：shadcn-vue（reka-ui）
- **状态管理**：Pinia
- **路由**：vue-router
- **样式**：Tailwind CSS
- **国际化**：i18next + 自研响应式绑定
- **构建工具**：Vite

## 快速开始

### 环境要求

- Node.js 18+
- pnpm

### 安装依赖

```bash
# 克隆项目
git clone [repository-url]
cd multi-chat

# 安装依赖
pnpm install
```

### 开发模式

```bash
# 启动开发服务器（Vite）
pnpm dev
```

### 构建应用

```bash
# 生产构建（输出静态资源到 dist/）
pnpm build
```

### 部署到 GitHub Pages

本项目支持部署到 GitHub Pages 在线访问。

**在线地址**：[https://max-loo.github.io/multi-chat/](https://max-loo.github.io/multi-chat/)

**本地部署命令**：
```bash
# 构建并部署到 GitHub Pages
pnpm deploy:gh-pages
```

**GitHub Actions 自动部署**：创建版本 tag（`v*.*.*`）时，GitHub Actions 使用官方 Pages Actions（`actions/upload-pages-artifact` + `actions/deploy-pages`）自动构建并部署。版本发布流程：

1. 更新 `package.json` 中的版本号
2. 创建 PR 并合并到 `main` 分支
3. `create-tag.yml` workflow 自动创建版本 tag
4. `deploy-to-gh-pages.yml` workflow 触发自动部署
   - **build job**：构建 Web 应用并上传 artifact
   - **deploy job**：部署 artifact 到 GitHub Pages

**技术细节**：
- 使用官方 GitHub Pages Actions（推荐方式）
- 构建与部署分为两个独立 job
- 更安全的权限模型（`pages: write` + `id-token: write`）
- 无需维护 gh-pages 分支

### 其他常用命令

```bash
# 运行代码检查（oxlint 检查 TS/JS，eslint-plugin-vue 检查 SFC）
pnpm lint

# 更新应用版本号
pnpm update-version

# 生成 i18n 类型定义
pnpm generate-i18n-types

# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行全部测试（含集成测试）
pnpm test:all
```

**详细测试文档**：项目有完整的测试规范与指南，见[测试文档](./src/__test__/README.md)：
- 行为驱动测试原则
- 测试隔离与 Mock 策略
- 测试目录结构与组织
- Before/After 对比示例
- 常见反模式与解决方案

## 使用指南

### 添加模型

1. 启动应用后，点击左侧导航栏的"模型"按钮
2. 点击"添加模型"按钮
3. 选择模型供应商（如 DeepSeek）
4. 填写模型信息：
   - 模型昵称（自定义名称）
   - API 密钥
   - API 端点
   - 备注（可选）
5. 点击"保存"完成

### 创建聊天

1. 点击左侧导航栏的"聊天"按钮
2. 点击聊天侧边栏中的"新建聊天"按钮
3. 为聊天命名（可选）
4. 点击"添加模型"并选择要对话的模型
5. 开始输入消息，同时与多个模型对话

### 聊天界面操作

- **发送消息**：在输入框输入内容后按 Enter 发送（Shift+Enter 换行）
- **停止对话**：点击发送按钮可中断进行中的对话
- **切换布局**：使用顶部工具栏切换单栏/多栏显示
- **查看历史**：滚动查看对话历史

## 项目结构

```
multi-chat/
├── src/                        # Vue 3 前端代码
│   ├── components/             # 共享组件
│   │   ├── ui-vue/            # shadcn-vue 基础组件
│   │   ├── chat/              # 聊天共享组件
│   │   └── ...                # 布局、侧边栏、对话框等
│   ├── pages/                 # 页面组件
│   │   ├── Chat/              # 聊天页
│   │   ├── Model/             # 模型管理页
│   │   └── Setting/           # 设置页
│   ├── composables/           # 组合式函数（可复用逻辑）
│   ├── config/                # 配置文件
│   │   └── initSteps.ts       # 初始化步骤配置
│   ├── locales/               # i18n 语言文件
│   │   ├── en/                # 英文语言包
│   │   ├── zh/                # 中文语言包
│   │   └── fr/                # 法文语言包
│   ├── services/              # 服务层
│   │   ├── chat/              # 聊天服务（模块化）
│   │   ├── modelRemote/       # 远程模型服务
│   │   ├── i18n.ts            # i18n 配置
│   │   └── global.ts          # 全局配置
│   ├── store/                 # 状态管理
│   │   ├── pinia/             # Pinia setup stores
│   │   ├── storage/           # 数据持久化（IndexedDB）
│   │   └── keyring/           # 主密钥管理
│   ├── types/                 # TypeScript 类型定义
│   └── utils/                 # 工具函数
│       ├── platform/          # Web 平台层（IndexedDB / Web Crypto / fetch / 语言检测）
│       ├── crypto.ts          # 加密工具
│       └── ...
├── public/                    # 静态资源
└── package.json               # 项目依赖与脚本
```

## 国际化

### 支持的语言

- 中文（zh）
- 英文（en）
- 法文（fr）

### 语言文件结构

语言文件位于 `src/locales/` 目录，按语言代码组织：

- 每种语言包含多个 JSON 文件，按功能模块组织：
  - `common.json`：通用文本（按钮、操作等）
  - `navigation.json`：导航菜单文本
  - `model.json`：模型管理文本
  - `chat.json`：聊天相关文本
  - `provider.json`：模型供应商文本
  - `setting.json`：设置文本
  - `table.json`：表格相关文本
  - `error.json`：错误信息文本

### 语言切换机制

1. 优先级顺序：
    - 本地存储的语言偏好
    - 系统语言（若支持）
    - 默认语言（英文）
2. 语言偏好存储在 `localStorage`，键为 `multi-chat-language`
3. 使用 `i18next` 与自研响应式绑定实现国际化

**语言代码自动迁移**：
- 应用升级时若语言代码发生变化（如 `zh-CN` → `zh`），系统自动迁移到新代码
- 迁移后显示通知，告知用户新的语言代码
- 若旧语言代码不再支持，系统自动清空缓存并回退到系统语言或英文
- 手动切换后语言偏好持久化到 localStorage，刷新后依然保持

**按需加载与性能优化**：
- ✅ **英文"第一公民"策略**：英文资源静态打包进主 bundle（约 5 KB），保证离线可用
- ✅ **按需加载**：启动时仅加载英文 + 系统语言，节省 33%-67% 的初始加载
- ✅ **智能缓存**：进行中的加载请求会被缓存，避免快速切换时的竞态条件

**自动持久化**：
- ✅ 切换语言时自动同步到 localStorage
- ✅ 静默降级：localStorage 写入失败仅记录警告，不影响应用运行

**消息队列机制**：
- ✅ 初始化期间的语言切换通知会进入队列
- ✅ Toaster 组件就绪后按顺序显示，间隔 500ms
- ✅ 避免时序问题导致的通知丢失

### 添加新语言支持

1. 在 `src/locales/` 下创建新的语言目录（如 `fr/`）
2. 复制现有语言文件结构并翻译内容
3. 在 `src/utils/constants.ts` 的 `SUPPORTED_LANGUAGE_LIST` 中添加新语言代码
4. 重启应用使新语言生效

## 开发说明

### 代码质量

项目使用以下工具保证代码质量：

- **oxlint + eslint-plugin-vue**：静态代码分析工具
  ```bash
  pnpm lint
  ```

- **knip**：检测未使用的代码、依赖和导出
  ```bash
  pnpm analyze:unused
  ```
  该命令扫描项目并报告：
  - 未使用的文件
  - 未使用的依赖（dependencies 和 devDependencies）
  - 未使用的导出（函数、变量、类型等）

  配置位于 `knip.json`，可调整入口、忽略规则等。

### 添加新模型供应商

1. 在 `src/utils/enums.ts` 中添加新的供应商枚举
2. 在 `src/services/chat/providerLoader.ts` 中注册对应的 Provider 工厂函数
3. 在 `src/pages/Model/CreateModel/components/ModelSidebar.vue` 中添加供应商选项

### 代码规范

- **导入路径**：始终使用 `@/` 别名导入，不使用相对路径
  ```typescript
  // 正确
  import { Model } from "@/types/model";

  // 错误
  import { Model } from "../../types/model";
  ```
- **代码注释**：在函数、类型、变量上方添加中文注释
- **设计原则**：遵循 SOLID、KISS、YAGNI、DRY 原则
- **架构参考**：详细设计文档见 [AGENTS.md](./AGENTS.md)

### 数据持久化

应用使用浏览器 IndexedDB 进行数据持久化（数据保存在浏览器本地）：

- **IndexedDB 数据库 `multi-chat-store`**：应用数据（`models.json` / `chats.json` 形态的键值记录）
- **IndexedDB 数据库 `multi-chat-keyring`**：加密主密钥存储

#### 数据文件

- `models.json`：模型配置（API 密钥字段加密）
- `chats.json`：聊天记录

#### 加密机制

- **算法**：AES-256-GCM（认证加密）
- **密钥管理**：
  - 主密钥由 Web Crypto API 生成（256 位随机密钥）
  - 主密钥经 PBKDF2 派生密钥加密后存储在 IndexedDB
  - 密钥种子存储在 `localStorage`（影响见 FAQ）
- **加密格式**：`enc:base64(ciphertext + auth_tag + nonce)`

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Vue - Official (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [TypeScript Vue Plugin](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

## FAQ

### Web 环境密钥丢失

**问题**：清除浏览器数据后无法解密之前的数据

**解决方案**：
- Web 环境将密钥种子存储在 `localStorage`，清除浏览器数据会导致密钥丢失
- 建议提前在设置页导出主密钥备份；密钥丢失后可通过导入恢复

### API 请求被 CORS 拦截

**问题**：应用部署在 GitHub Pages 时，部分 AI 供应商 API 请求出现 CORS 错误

**解决方案**：
- 浏览器同源策略限制直连不支持 CORS 的 API
- 开发环境经 Vite 开发服务器代理供应商 API（配置见 `vite.config.ts`）
- 生产环境请使用支持 CORS 的供应商，或将应用部署在自建代理之后（反向代理 / 边缘函数）

## 许可证

MIT License
