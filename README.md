# Multi-Chat

一个基于 Tauri + React + TypeScript 的多模型聊天应用，支持同时与多个 AI 模型进行对话，方便对比不同模型的回答。

## 功能特点

### 🤖 多模型支持

- 支持添加多个不同服务商的 AI 模型（如 DeepSeek、月之暗面等）
- 可为每个模型配置独立的 API 密钥和地址
- 支持模型的启用/禁用管理
- 模型配置信息本地安全存储

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
- 响应式布局，适配不同屏幕尺寸
- 支持自定义聊天窗口布局（单列/多列显示）
- 优雅的动画和过渡效果

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

### 其他常用命令

```bash
# 运行代码检查（使用 oxlint）
pnpm lint

# 类型检查
pnpm tsc

# 更新应用版本号
pnpm update-version

# 生成国际化类型定义
pnpm generate-i18n-types
```

```bash
# 构建生产版本
pnpm tauri build
```

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
│   ├── lib/                   # 核心库
│   │   ├── i18n.ts            # 国际化配置
│   │   └── global.ts          # 全局配置
│   ├── locales/               # 国际化语言文件
│   │   ├── en/                # 英文语言包
│   │   └── zh/                # 中文语言包
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

### 语言切换机制

1. 优先级顺序：
   - 本地存储的语言设置
   - 系统语言（如果支持）
   - 默认语言（英文）
2. 语言设置存储在 `localStorage` 中，键名为 `multi-chat-language`
3. 使用 `i18next` 和 `react-i18next` 实现国际化功能

### 添加新语言支持

1. 在 `src/locales/` 下创建新的语言目录（如 `fr/`）
2. 复制现有语言文件结构并翻译内容
3. 在 `src/utils/constants.ts` 中的 `SUPPORTED_LANGUAGE_LIST` 添加新语言代码
4. 重启应用使新语言生效

## 开发说明

### 添加新的模型服务商

1. 在 `src/utils/enums.ts` 中添加新的服务商枚举
2. 在 `src/lib/factory/` 中实现对应的服务商工厂类
3. 在 `src/pages/Model/components/ModelSidebar.tsx` 中添加服务商选项

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
  - 主密钥存储在系统安全存储（macOS 钥匙串 / Windows DPAPI / Linux Secret Service）
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
- 建议定期导出模型配置和聊天记录作为备份
- 重要的敏感数据建议使用桌面版处理

### 模型配置加密失败

**问题**: 添加模型时提示加密失败

**解决方案**:
1. 检查主密钥是否正确初始化
2. 尝试重新启动应用
3. 如果问题持续，可能是 Web Crypto API 不支持，请使用现代浏览器（Chrome 90+、Firefox 88+、Safari 14.1+）

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 许可证

MIT License
