## Why

当前国际化实现在应用启动时无条件加载所有支持的语言资源（en、zh、fr），包括 21 个 JSON 文件（3 种语言 × 7 个命名空间），总计约 15 KB。这导致即使用户系统语言为中文，也会加载法文资源，浪费内存和初始加载时间。随着支持语言数量的增加，这一问题会更加严重。

## What Changes

- **英文资源"第一公民"策略**：英文资源同步打包到主 bundle，确保即使网络故障也能启动
- **语言级按需加载**：启动时仅加载英文（同步）+ 系统语言（如果支持，异步），节省 33%-67% 初始加载量（取决于系统语言）
- **语言切换懒加载**：用户切换语言时，动态加载目标语言并缓存已加载语言，回退时无需重新加载
- **错误处理增强**：
  - 加载失败时自动重试（2 次，指数退避）
  - 仅重试网络错误，不重试解析错误或 404
  - 最终降级到英文，确保应用可用
  - Toast 警告提示用户（不阻塞启动）
- **用户反馈优化**：语言切换时显示 Toast 加载提示，区分首次加载和缓存命中

## Capabilities

### New Capabilities
- `i18n-lazy-loading`: 国际化语言级按需加载能力，支持启动时并行加载、切换时懒加载、错误降级和重试机制

### Modified Capabilities
无（此变更为纯性能优化，不改变 API 行为或需求）

## Impact

**受影响的代码模块**：
- `src/lib/i18n.ts` - 核心改造，新增语言加载缓存、`loadLanguage()` 函数、改造 `initI18n()` 和 `changeAppLanguage()`
- `src/config/initSteps.ts` - 调整 i18n 初始化步骤，传入系统语言参数
- `src/store/middleware/appConfigMiddleware.ts` - 增强 Toast 加载提示和错误处理
- `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx` - 添加切换时的 loading 状态

**测试文件**：
- `src/__test__/lib/i18n.test.ts` - 更新单元测试，覆盖加载缓存、重试机制、懒加载逻辑
- `src/__test__/lib/initialization.test.ts` - 新增集成测试，验证完整的初始化和错误降级流程
- `src/__test__/store/middleware/appConfigMiddleware.test.ts` - 更新 middleware 测试

**性能指标**：
- 初始加载量：
  - **最佳情况**（系统语言为英文）：从 15 KB 减少到 5 KB（节省 67%，仅英文资源）
  - **典型情况**（系统语言为其他语言，如中文/法文）：从 15 KB 减少到 10 KB（节省 33%，英文 5 KB + 系统语言 5 KB）
- 内存占用：英文资源始终在内存，其他语言按需加载
- 启动速度：英文资源同步加载，零延迟；系统语言异步加载，预计减少 50-100 ms

**依赖和工具**：
- 继续使用 i18next 和 react-i18next（无需新增依赖）
- 英文资源使用静态 import，同步打包到主 bundle
- 其他语言使用 Vite 的 `import.meta.glob` 实现动态导入
- 使用现有的 Toast 系统（sonner）提供用户反馈（同步导入）
