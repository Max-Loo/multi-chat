# 实现任务清单

## 1. 修改静态 Provider 的 Logo URL

- [x] 1.1 修改 KimiProvider 的 logo URL
  - 文件：`src/lib/factory/modelProviderFactory/providers/KimiProvider.ts`
  - 将 `readonly logoUrl = 'https://www.moonshot.cn/favicon.ico'` 修改为 `readonly logoUrl = 'https://models.dev/logos/kimi.svg'`

- [x] 1.2 修改 BigModelProvider 的 logo URL
  - 文件：`src/lib/factory/modelProviderFactory/providers/BigModelProvider.ts`
  - 将 `readonly logoUrl = 'https://cdn.bigmodel.cn/static/logo/dark.svg'` 修改为 `readonly logoUrl = 'https://models.dev/logos/bigmodel.svg'`

- [x] 1.3 修改 DeepseekProvider 的 logo URL
  - 文件：`src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts`
  - 将 `readonly logoUrl = 'https://deepseek.com/favicon.ico'` 修改为 `readonly logoUrl = 'https://models.dev/logos/deepseek.svg'`

## 2. 修改动态 Provider 的 Logo URL 生成逻辑

- [x] 2.1 在 DynamicModelProvider 构造函数中添加 logo URL 赋值
  - 文件：`src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`
  - 在构造函数中将 `this.logoUrl = undefined;` 修改为 `this.logoUrl = 'https://models.dev/logos/${this.key}.svg';`
  - 使用模板字符串，根据 `providerKey` 动态生成 logo URL

## 3. 验证实现

- [x] 3.1 运行开发环境并检查静态 Provider 的 logo 显示
  - 运行 `pnpm tauri dev`
  - 打开模型列表页面，验证 Kimi、BigModel、DeepSeek 的 logo 是否正确显示

- [x] 3.2 检查动态注册的 Provider 的 logo 显示
  - 确认从远程 API 动态注册的 Provider 是否正确显示 logo
  - 验证 logo URL 格式是否为 `https://models.dev/logos/{provider}.svg`

- [x] 3.3 检查创建模型页面的 logo 显示
  - 打开创建模型页面
  - 验证模型供应商侧边栏是否正确显示 logo

- [x] 3.4 运行代码检查
  - 运行 `pnpm lint` 确保代码质量
  - 运行 `pnpm tsc` 确保类型检查通过

## 4. 可选：验证 Logo 资源可用性

- [x] 4.1 手动验证 models.dev 的 logo 文件是否存在
  - 访问 `https://models.dev/logos/deepseek.svg` 确认可访问
  - 访问 `https://models.dev/logos/kimi.svg` 确认可访问
  - 访问 `https://models.dev/logos/bigmodel.svg` 确认可访问
  - 如果某个 logo 不存在，记录问题并考虑回退到原 URL
