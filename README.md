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
- 基于 Ant Design X 组件库的现代化 UI 设计
- 响应式布局，适配不同屏幕尺寸
- 支持自定义聊天窗口布局（单列/多列显示）
- 优雅的动画和过渡效果

### 🔒 数据安全
- 本地数据存储，保护隐私
- API 密钥安全加密存储
- 🚧 支持数据导入/导出

## 技术栈

- **前端框架**: React 19 + TypeScript
- **UI 组件库**: Ant Design + Ant Design X
- **状态管理**: Redux Toolkit
- **路由**: React Router v7
- **样式**: Tailwind CSS
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
# 启动开发服务器
pnpm tauri dev
```

### 构建应用

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
src/
├── components/        # 公共组件
│   ├── FilterInput/  # 过滤输入组件
│   ├── Layout/       # 布局组件
│   └── Sidebar/      # 侧边栏组件
├── pages/            # 页面组件
│   ├── Chat/         # 聊天页面
│   └── Model/        # 模型管理页面
├── hooks/            # 自定义 Hooks
├── store/            # Redux 状态管理
│   ├── slices/       # Redux 切片
│   └── vaults/       # 数据持久化
├── types/            # TypeScript 类型定义
└── utils/            # 工具函数
```

## 开发说明

### 添加新的模型服务商

1. 在 `src/utils/enums.ts` 中添加新的服务商枚举
2. 在 `src/lib/factory/` 中实现对应的服务商工厂类
3. 在 `src/pages/Model/components/ModelSidebar.tsx` 中添加服务商选项

### 数据持久化

应用使用 Tauri 的 Store 插件进行数据持久化，数据存储位置：
- Windows: `%APPDATA%\com.<username>.multi-chat`
- macOS: `~/Library/Application Support/com.<username>.multi-chat`
- Linux: `~/.config/com.<username>.multi-chat`

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 许可证

MIT License