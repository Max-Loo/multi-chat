# Multi-Chat 项目开发规范

## 基础技术栈规范

- 包管理使用pnpm而不是npm
- 项目使用TypeScript进行开发，启用严格模式
- 项目使用React 19作为前端框架，并使用React Compiler进行优化
- 项目使用Tauri 2作为桌面应用框架
- UI组件库使用Ant Design和Ant Design X
- 状态管理使用Redux Toolkit
- 路由使用React Router v7
- 样式使用Tailwind CSS
- 国际化使用i18next和react-i18next

## 代码规范

### TypeScript规范
- 启用严格模式检查，包括`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- 所有组件和函数必须有明确的类型注解
- 使用路径别名`@/*`引用src目录下的文件

### 代码格式规范
- 使用2个空格进行缩进，不要使用Tab
- 对象和数组使用尾逗号
- 行尾不能有多余空格
- 对象大括号内要有空格，数组括号内不要有空格
- 中缀操作符周围要有空格
- 关键字前后要有空格
- 箭头函数前后要有空格

### 组件规范
- 使用函数组件和React Hooks
- 组件名使用PascalCase命名
- 文件名使用PascalCase命名
- 每个组件应有独立的文件夹，包含index.tsx文件
- 自定义Hooks以`use`开头，使用camelCase命名
- 组件和函数必须有明确的返回类型注解

## 项目结构规范

### 目录组织
```
src/
├── components/        # 公共组件
├── pages/           # 页面组件
├── hooks/           # 自定义 Hooks
├── lib/             # 核心库
├── locales/         # 国际化语言文件
├── store/           # Redux 状态管理
├── types/           # TypeScript 类型定义
└── utils/           # 工具函数
```

### 命名规范
- 组件文件夹和组件名使用PascalCase
- 文件名与组件名保持一致
- 工具函数文件名使用camelCase
- 常量使用UPPER_SNAKE_CASE
- 类型定义文件名使用camelCase

## 测试规范

- 使用Vitest作为测试框架
- 测试文件放在`__tests__`目录下，与源文件结构保持一致
- 测试文件命名使用`.test.ts`或`.test.tsx`后缀
- 测试覆盖率要求：分支85%以上，函数95%以上，行数90%以上，语句90%以上
- 使用`pnpm test:run`运行测试，而不是`pnpm test`
- 测试配置位于vite.config.ts的test配置项中

## 国际化规范

- 语言文件位于`src/locales/`目录下，按语言代码分类
- 支持的语言：中文(zh)、英文(en)
- 语言文件按功能模块划分：common.json、navigation.json、model.json等
- 修改了i18n配置文件后，需要使用`pnpm run generate-i18n-types`生成i18n类型文件
- 语言设置存储在localStorage中，键名为`multi-chat-language`

## 状态管理规范

- 使用Redux Toolkit进行状态管理
- 状态切片放在`store/slices/`目录下
- 中间件放在`store/middleware/`目录下
- 数据持久化使用Tauri的Store插件，代码放在`store/storage/`目录下
- 安全存储使用Tauri的Stronghold插件，代码放在`store/vaults/`目录下

## 代码维护规范

- 在修改代码的过程中，如果因为此次修改导致部分代码未被使用，需要及时删除未被使用的代码
- 每个功能模块应有清晰的注释说明其用途
- 避免在代码中留下TODO或FIXME注释，如有需要应在相关issue中记录
- 提交前应运行`pnpm lint`检查代码风格，并修复所有警告和错误

## 构建与部署规范

- 开发环境使用`pnpm dev`启动
- 生产构建使用`pnpm build`
- Web开发使用`pnpm web:dev`，Web构建使用`pnpm web:build`
- 版本更新使用`pnpm run update-version`脚本

## 其他规范

- 不要提交API密钥、密码等敏感信息到代码仓库
- 使用相对路径引用同目录下的文件，使用绝对路径(@/)引用其他目录的文件
- 优先使用项目已有的工具函数和组件，避免重复造轮子
- 新增第三方依赖需要评估必要性，并确保其安全性