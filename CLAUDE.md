# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 Tauri + React + TypeScript 的桌面应用，结合 Rust 后端和 React 前端，使用 Vite 构建。

## 技术栈

### 前端
- **框架**: React 19 + TypeScript + Vite
- **UI**: Ant Design + Ant Design X
- **状态管理**: Redux Toolkit
- **路由**: React Router v7
- **样式**: Tailwind CSS
- **国际化**: i18next + react-i18next
- **测试**: Vitest
- **优化**: React Compiler

### 后端
- **框架**: Rust + Tauri 2.0
- **插件**: tauri-plugin-store、tauri-plugin-stronghold、tauri-plugin-opener、tauri-plugin-http、tauri-plugin-shell、tauri-plugin-os

### 开发配置
- **包管理器**: pnpm
- **TypeScript**: 严格模式
- **端口**: 1420

## 项目结构

```
multi-chat/
├── src/                     # React 前端
│   ├── components/          # 公共组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 核心库
│   ├── locales/            # 国际化语言文件
│   ├── store/              # Redux 状态管理
│   │   ├── slices/         # 状态切片
│   │   ├── middleware/     # 中间件
│   │   ├── storage/        # 数据持久化
│   │   └── vaults/         # 安全存储
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   └── __tests__/          # 测试文件
├── src-tauri/              # Rust 后端
├── public/                 # 静态资源
├── .trae/                  # 项目配置和规范
└── dist/                   # 构建输出（gitignore）
```

## 开发命令

```bash
# 依赖
pnpm install

# 开发
pnpm dev              # 启动前后端
pnpm web:dev          # 仅前端

# 构建
pnpm build            # 生产构建
pnpm web:build        # Web 构建

# 检查
pnpm lint             # 代码检查
pnpm tsc              # 类型检查

# 测试
pnpm test:run         # 运行测试
pnpm test:coverage    # 测试覆盖率

# 工具
pnpm generate-i18n-types  # 生成国际化类型
pnpm update-version       # 更新版本
```

## 代码规范

### 基础规范
- **缩进**: 2 个空格
- **路径别名**: `@/` 引用 src 目录
- **命名规范**:
  - 组件: PascalCase
  - 工具函数: camelCase
  - 常量: UPPER_SNAKE_CASE

### TypeScript
- 严格模式检查
- 明确的类型注解
- JSDoc 注释格式

```typescript
/**
 * 函数描述
 * @param param 参数描述
 */
```

### 组件规范
- 函数组件 + React Hooks
- 组件名 PascalCase
- 文件名与组件名一致
- 自定义 Hooks 以 `use` 开头

## Tauri 命令开发

1. 在 `src-tauri/src/lib.rs` 中添加 `#[tauri::command]` 函数
2. 在 `invoke_handler` 中注册命令
3. 前端通过 `invoke("command_name", { args })` 调用

## 国际化

- **配置**: `src/lib/i18n.ts`
- **语言文件**: `src/locales/`
- **支持语言**: 中文 (zh)、英文 (en)
- **语言存储**: localStorage (`multi-chat-language`)

### 语言文件结构
```
src/locales/
├── en/  # 英文
├── zh/  # 中文
└── README.md
```

修改配置后运行 `pnpm generate-i18n-types`。

## 测试

- **框架**: Vitest
- **测试文件**: `__tests__` 目录，`.test.ts` 或 `.test.tsx` 后缀
- **覆盖率要求**:
  - 分支: 85%+
  - 函数: 95%+
  - 行数: 90%+
  - 语句: 90%+

## 编程原则

1. **KISS**: 简洁直观
2. **YAGNI**: 仅实现明确需求
3. **SOLID**: 面向对象设计原则
4. **DRY**: 避免重复

## 重要提醒

- 不提交 API 密钥等敏感信息
- 及时删除未使用代码
- 提交前运行 `pnpm lint`
- 优先使用已有工具函数和组件
- 新增依赖需评估必要性


