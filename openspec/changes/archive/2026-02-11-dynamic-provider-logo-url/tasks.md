## 1. 数据层变更

- [x] 1.1 修改 `ModelProvider` 接口，移除 `logoUrl?: string` 属性定义
- [x] 1.2 修改 `ConfigurableModelProvider` 基类，移除 `abstract readonly logoUrl?: string` 抽象属性
- [x] 1.3 修改 `DeepseekProvider.ts`，删除硬编码的 `logoUrl` 属性赋值
- [x] 1.4 修改 `KimiProvider.ts`，删除硬编码的 `logoUrl` 属性赋值
- [x] 1.5 修改 `BigModelProvider.ts`，删除硬编码的 `logoUrl` 属性赋值
- [x] 1.6 修改 `registerDynamicProviders.ts`，删除 `DynamicModelProvider` 构造函数中的 `logoUrl` 拼接逻辑

## 2. UI 层变更

- [x] 2.1 修改 `ModelProviderDisplay.tsx`，使用 `https://models.dev/logos/${provider.key}.svg` 替换 `provider.logoUrl`
- [x] 2.2 修改 `ModelSidebar.tsx`，使用 `https://models.dev/logos/${provider.key}.svg` 替换 `provider.logoUrl`

## 3. 验证与测试

- [x] 3.1 运行 TypeScript 类型检查（`pnpm tsc`），确保没有类型错误
- [x] 3.2 运行 ESLint 检查（`pnpm lint`），确保代码符合规范
- [x] 3.3 启动开发服务器（`pnpm tauri dev`），验证所有模型供应商的 Logo 正常显示
- [x] 3.4 检查浏览器控制台，确认没有 404 错误或其他异常
