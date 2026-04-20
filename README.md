# Multi-Chat

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://max-loo.github.io/multi-chat/)
[![Deploy to GitHub Pages](https://github.com/Max-Loo/multi-chat/actions/workflows/deploy-to-gh-pages.yml/badge.svg)](https://github.com/Max-Loo/multi-chat/actions/workflows/deploy-to-gh-pages.yml)

一个基于 Tauri + React + TypeScript 的多模型聊天应用，支持同时与多个 AI 模型进行对话，方便对比不同模型的回答。

## 功能特点

### 🤖 多模型支持

- 支持添加多个不同服务商的 AI 模型（如 DeepSeek、月之暗面等）
- 可为每个模型配置独立的 API 密钥和地址
- 支持模型的启用/禁用管理
- 模型配置信息本地安全存储
- 🔌 **远程模型数据获取**：从 `models.dev API` 动态获取模型供应商定义，保持数据最新
- ⚡ **性能优化**：供应商 SDK 按需加载，减少初始 bundle 大小约 125KB（gzipped）

### 💬 多模型同时对话

- 创建聊天会话，可同时与多个模型进行对话
- 同一问题可同时发送给多个模型，直观对比不同模型的回答
- 支持实时流式响应展示
- 支持中断正在进行的对话

### 📝 聊天管理

- 创建、编辑、删除聊天会话
- 聊天历史记录持久化存储
- 支持聊天会话的搜索和过滤
- 可折叠的侧边栏设计，节省空间

### 🎨 现代化界面

- 基于 shadcn/ui 和 Radix UI 组件库的现代化 UI 设计
- **四级响应式布局系统**，自动适配不同屏幕尺寸
- 支持自定义聊天窗口布局（单列/多列显示）
- 优雅的动画和过渡效果

### 📱 响应式布局特性

应用支持四级响应式布局，根据窗口宽度自动调整：

- **Desktop** (≥1280px): 完整桌面布局，侧边栏 224px
- **Compressed** (1024-1279px): 压缩布局，侧边栏 192px（缩小字体和图标）
- **Compact** (768-1023px): 紧凑布局，侧边栏 192px（缩小字体和图标）
- **Mobile** (<768px): 移动端布局
  - 侧边栏集成到抽屉中（从左侧滑出）
  - 底部导航栏（Chat/Model/Setting）
  - 触摸优化交互

**技术特性**：
- 窗口 resize 时自动平滑切换（150ms 防抖）
- CSS 过渡动画流畅无卡顿
- 完整的键盘导航和 ARIA 标签支持

### 🔒 数据安全

- 本地数据存储，保护隐私
- API 密钥使用 AES-256-GCM 加密存储
- 主密钥通过 `tauri-plugin-keyring` 安全存储到系统钥匙串
- 敏感数据字段级加密，非敏感数据明文存储
- 数据存储为 JSON 格式，便于备份和查看

## 技术栈

- **前端框架**: React 19 + TypeScript
- **UI 组件库**: shadcn/ui + Radix UI
- **状态管理**: Redux Toolkit
- **路由**: React Router v7
- **样式**: Tailwind CSS
- **国际化**: i18next + react-i18next
- **桌面框架**: Tauri 2
- **构建工具**: Vite

## 快速开始

### 环境要求

- Node.js 18+
- pnpm
- Rust 1.70+ (用于构建 Tauri 应用)

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
# 启动 Tauri 桌面应用开发模式（同时启动前端和后端）
pnpm tauri dev

# 启动 Web 浏览器开发模式（仅前端）
pnpm web:dev
```

### 构建应用

```bash
# 构建 Tauri 桌面应用生产版本
pnpm tauri build

# 构建 Web 应用生产版本
pnpm web:build
```

### 部署到 GitHub Pages

本项目支持部署到 GitHub Pages，提供在线访问能力。

**在线访问地址**: [https://max-loo.github.io/multi-chat/](https://max-loo.github.io/multi-chat/)

**本地部署命令**:
```bash
# 构建并部署到 GitHub Pages
pnpm deploy:gh-pages
```

**GitHub Actions 自动部署**: 当创建版本 tag（`v*.*.*`）时，GitHub Actions 使用官方 Pages Actions（`actions/upload-pages-artifact` + `actions/deploy-pages`）自动构建并部署。版本发布流程如下：

1. 更新 `package.json` 中的版本号
2. 创建 PR 并合并到 `main` 分支
3. `create-tag.yml` workflow 自动创建版本 tag
4. `deploy-to-gh-pages.yml` workflow 触发自动部署
   - **build job**: 构建 Web 应用并上传 artifact
   - **deploy job**: 将 artifact 部署到 GitHub Pages

同时，桌面应用构建（`build-and-release.yml`）也会并行触发，确保桌面和 Web 版本同步发布。

**技术细节**:
- 使用 GitHub Pages 官方 Actions（推荐方式）
- 分离构建和部署为两个独立的 job
- 更安全的权限模型（`pages: write` + `id-token: write`）
- 不需要维护 gh-pages 分支

### 其他常用命令

```bash
# 运行代码检查（使用 oxlint）
pnpm lint

# 更新应用版本号
pnpm update-version

# 生成国际化类型定义
pnpm generate-i18n-types

# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行所有测试（包括集成测试）
pnpm test:all
```

**详细测试文档**：项目有完整的测试规范和指南，请查看 [测试文档](./src/__test__/README.md) 了解：
- 行为驱动测试原则
- 测试隔离和 Mock 策略
- 测试目录结构和组织方式
- Before/After 对比示例
- 常见反模式和解决方案

## 使用指南

### 添加模型

1. 启动应用后，点击左侧导航栏的"模型"按钮
2. 点击"添加模型"按钮
3. 选择模型服务商（如 DeepSeek）
4. 填写模型信息：
   - 模型昵称（自定义名称）
   - API 密钥
   - API 地址
   - 备注（可选）
5. 点击"保存"完成添加

### 创建聊天

1. 点击左侧导航栏的"聊天"按钮
2. 点击聊天侧边栏的"新建聊天"按钮
3. 为聊天命名（可选）
4. 点击"添加模型"，选择要对话的模型
5. 开始输入消息，与多个模型同时对话

### 聊天界面操作

- **发送消息**: 在输入框中输入内容，按 Enter 发送（Shift+Enter 换行）
- **停止对话**: 点击发送按钮可中断正在进行的对话
- **切换布局**: 使用顶部工具栏切换单列/多列显示模式
- **查看历史**: 滚动查看历史对话记录

## 项目结构

```
multi-chat/
├── src/                        # React 前端代码
│   ├── components/             # 公共组件
│   │   ├── ui/                # shadcn/ui 组件
│   │   ├── FilterInput/       # 过滤输入组件
│   │   ├── Layout/            # 布局组件
│   │   └── Sidebar/           # 侧边栏组件
│   ├── pages/                 # 页面组件
│   │   ├── Chat/              # 聊天页面
│   │   ├── Model/             # 模型管理页面
│   │   └── Setting/           # 设置页面
│   ├── hooks/                 # 自定义 Hooks
│   ├── config/                # 配置文件
│   │   └── initSteps.ts       # 初始化步骤配置
│   ├── locales/               # 国际化语言文件
│   │   ├── en/                # 英文语言包
│   │   ├── zh/                # 中文语言包
│   │   └── fr/                # 法文语言包
│   ├── services/              # 服务层
│   │   ├── chat/              # 聊天服务（模块化）
│   │   ├── modelRemote/       # 远程模型服务
│   │   ├── i18n.ts            # 国际化配置
│   │   └── global.ts          # 全局配置
│   ├── store/                 # Redux 状态管理
│   │   ├── slices/            # Redux 切片
│   │   ├── middleware/        # 中间件
│   │   ├── storage/           # 数据持久化
│   │   └── keyring/           # 主密钥管理
│   ├── types/                 # TypeScript 类型定义
│   └── utils/                 # 工具函数
│       ├── tauriCompat/       # Tauri 兼容层
│       ├── crypto.ts          # 加密工具
│       └── ...
├── src-tauri/                 # Rust 后端代码
│   ├── src/
│   │   ├── lib.rs             # Tauri 命令定义
│   │   └── main.rs            # 入口文件
│   └── tauri.conf.json        # Tauri 配置
├── public/                    # 静态资源
└── package.json               # 项目依赖和脚本
```

## 国际化配置

### 支持的语言

- 中文 (zh)
- 英文 (en)
- 法文 (fr)

### 语言文件结构

语言文件位于 `src/locales/` 目录下，按语言代码分类：

- 每种语言包含多个 JSON 文件，按功能模块划分：
  - `common.json`: 通用文本（按钮、操作等）
  - `navigation.json`: 导航菜单文本
  - `model.json`: 模型管理相关文本
  - `chat.json`: 聊天相关文本
  - `provider.json`: 模型提供商文本
  - `setting.json`: 设置相关文本
  - `table.json`: 表格相关文本
  - `error.json`: 错误提示文本

### 语言切换机制

1. 优先级顺序：
    - 本地存储的语言设置
    - 系统语言（如果支持）
    - 默认语言（英文）
2. 语言设置存储在 `localStorage` 中，键名为 `multi-chat-language`
3. 使用 `i18next` 和 `react-i18next` 实现国际化功能

**语言代码自动迁移**：
- 应用升级时，如果语言代码发生变更（如 `zh-CN` → `zh`），系统会自动迁移到新的语言代码
- 迁移后显示提示信息，告知用户新的语言代码
- 如果旧的语言代码不再支持，系统会自动清理缓存并降级到系统语言或英文
- 语言设置在手动切换后会持久化到 localStorage，刷新后保持不变

**按需加载与性能优化**：
- ✅ **英文"第一公民"**：英文资源静态打包到主 bundle（~5 KB），确保离线可用
- ✅ **按需加载**：启动时仅加载英文 + 系统语言，节省 33%-67% 初始加载量
- ✅ **智能缓存**：缓存进行中的加载请求，避免快速切换时的竞态条件

**自动持久化**：
- ✅ 语言变更通过 Redux Middleware 自动同步到 localStorage
- ✅ 静默降级：localStorage 写入失败时记录警告，不影响应用运行

**消息队列机制**：
- ✅ 初始化期间的语言切换提示暂存在队列中
- ✅ Toaster 组件就绪后按顺序显示，每个消息间隔 500ms
- ✅ 避免时序问题导致的提示丢失

### 添加新语言支持

1. 在 `src/locales/` 下创建新的语言目录（如 `fr/`）
2. 复制现有语言文件结构并翻译内容
3. 在 `src/utils/constants.ts` 中的 `SUPPORTED_LANGUAGE_LIST` 添加新语言代码
4. 重启应用使新语言生效

## 开发说明

### 代码质量

项目使用以下工具保证代码质量：

- **oxlint**: 代码静态分析工具
  ```bash
  pnpm lint
  ```

- **knip**: 检测未使用的代码、依赖和导出
  ```bash
  pnpm analyze:unused
  ```
  此命令会扫描项目并报告：
  - 未使用的文件
  - 未使用的依赖（dependencies 和 devDependencies）
  - 未使用的导出（函数、变量、类型等）
  
  配置位于 `knip.json`，可以根据需要调整入口点、忽略规则等。

### 添加新的模型服务商

1. 在 `src/utils/enums.ts` 中添加新的服务商枚举
2. 在 `src/services/chat/providerLoader.ts` 中注册对应的 Provider 工厂函数
3. 在 `src/pages/Model/CreateModel/components/ModelSidebar.tsx` 中添加服务商选项

### 代码规范

- **导入路径**：始终使用 `@/` 别名导入，不使用相对路径
  ```typescript
  // 正确
  import { Model } from "@/types/model";
  
  // 错误
  import { Model } from "../../types/model";
  ```
- **代码注释**：函数、类型、变量上方添加中文注释
- **设计原则**：遵循 SOLID、KISS、YAGNI、DRY 原则
- **架构参考**：详细设计说明请查看 [AGENTS.md](./AGENTS.md)

### 数据持久化

应用使用 @tauri-apps/plugin-store 插件进行数据持久化，数据存储位置：

- **Windows**: `%APPDATA%\multi-chat`
- **macOS**: `~/Library/Application Support/multi-chat`
- **Linux**: `~/.config/multi-chat`

#### 数据文件

- `models.json`: 模型配置（API 密钥字段已加密）
- `chats.json`: 聊天记录

#### 加密机制

- **算法**: AES-256-GCM（认证加密）
- **密钥管理**:
  - 主密钥由 Web Crypto API 生成（256-bit 随机密钥）
  - 桌面端：存储在系统安全存储（macOS 钥匙串 / Windows DPAPI / Linux Secret Service）
  - Web 环境：使用 IndexedDB 加密存储（与桌面端系统钥匙串对应）
  - 使用 `tauri-plugin-keyring` 统一管理跨平台密钥存储
- **加密格式**: `enc:base64(ciphertext + auth_tag + nonce)`
- **仅支持桌面端**: 不支持移动端（iOS/Android）

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 常见问题

### Tauri 构建失败

**问题**: 运行 `pnpm tauri build` 时报错

**解决方案**:
1. 确保 Rust 工具链已正确安装：`rustc --version`
2. 确保 Tauri CLI 已正确安装：`pnpm tauri --version`
3. 尝试清理缓存：`pnpm tauri build --clean`

### Web 环境密钥丢失

**问题**: Web 环境下清除浏览器数据后，无法解密之前的数据

**解决方案**:
- Web 环境的密钥种子存储在 `localStorage` 中，清除浏览器数据会导致密钥丢失
- 建议提前在设置页面导出主密钥作为备份，密钥丢失后可通过导入恢复
- 重要的敏感数据建议使用桌面版处理

## 许可证

MIT License
