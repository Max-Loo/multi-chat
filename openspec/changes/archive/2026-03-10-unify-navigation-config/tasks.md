# 统一导航配置管理 - 实施任务清单

## 1. 创建导航配置文件

- [x] 1.1 创建 `src/config/navigation.ts` 文件
- [x] 1.2 定义 `NavigationItemId` 类型联合（"chat" | "model" | "setting"）
- [x] 1.3 定义 `NavigationItem` 接口（包含 id, i18nKey, path, icon, theme 字段）
- [x] 1.4 定义 `NAVIGATION_ITEMS` 常量数组（使用 as const 断言）
- [x] 1.5 创建 `NAVIGATION_ITEM_MAP` Map 对象
- [x] 1.6 导出所有类型和常量

## 2. 更新 Sidebar 组件

- [x] 2.1 导入 `NAVIGATION_ITEMS` 配置
- [x] 2.2 删除组件内部的 `navigationItems` 定义
- [x] 2.3 更新 `navigationItems` 的 useMemo hook，使用配置数据并转换为组件所需格式
- [x] 2.4 验证图标渲染（icon 字段为 ReactNode 类型）
- [x] 2.5 验证样式类名应用（theme.base, theme.active, theme.inactive）

## 3. 更新 BottomNav 组件

- [x] 3.1 导入 `NAVIGATION_ITEMS` 配置
- [x] 3.2 删除组件内部的 `navItems` 定义
- [x] 3.3 更新 `navItems` 的 useMemo hook，使用配置数据并转换为组件所需格式
- [x] 3.4 验证动态图标渲染（icon 字段为 LucideIcon 类型）
- [x] 3.5 验证无障碍支持（aria-label 使用国际化键）

## 4. 类型安全验证

- [x] 4.1 运行 `pnpm tsc` 检查 TypeScript 类型错误
- [x] 4.2 确保 `NavigationItemId` 类型正确推导
- [x] 4.3 确保 `i18nKey` 模板字面量类型正确
- [x] 4.4 确保 `icon` 字段支持联合类型 `LucideIcon | ReactNode`

## 5. 运行时验证

- [x] 5.1 启动开发服务器 `pnpm tauri dev`
- [x] 5.2 验证 Sidebar 显示正确（chat, model, setting 三个导航项）
- [x] 5.3 验证 BottomNav 显示正确（移动端模式下）
- [x] 5.4 验证导航点击功能正常
- [x] 5.5 验证激活状态样式正确应用
- [x] 5.6 验证国际化文本正确显示

## 6. 代码质量检查

- [x] 6.1 运行 `pnpm lint` 检查代码规范
- [x] 6.2 修复所有 linting 错误
- [x] 6.3 添加必要的注释（中文）
- [x] 6.4 验证导入路径使用 `@/` 别名

## 7. 测试更新

- [x] 7.1 查找使用导航配置的测试文件
- [x] 7.2 更新测试文件的导入路径
- [x] 7.3 添加新配置文件的单元测试（如需要）
- [x] 7.4 运行 `pnpm test:all` 确保测试通过

## 8. 文档更新

- [x] 8.1 更新 AGENTS.md（如有必要）
- [x] 8.2 添加导航配置的文档注释
- [x] 8.3 更新相关的组件文档（如有必要）
