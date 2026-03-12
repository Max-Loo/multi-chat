# E2E 测试说明

本目录包含 Multi-Chat 应用的端到端（E2E）测试。

## 目录结构

```
e2e/
├── fixtures/           # 测试 Fixtures
│   └── i18n-fixtures.ts
├── specs/              # 测试规范
│   ├── i18n.md         # i18n 测试计划
│   └── i18n/           # i18n 测试文件
│       ├── language-switch.spec.ts
│       ├── on-demand-loading.spec.ts
│       ├── cache-validation.spec.ts
│       ├── toast-queue.spec.ts
│       ├── persistence.spec.ts
│       ├── ui-rendering.spec.ts
│       ├── error-handling.spec.ts
│       └── performance.spec.ts
└── utils/              # 测试工具函数
    └── i18n-helpers.ts
```

## 运行测试

### 前置条件

1. 确保已安装依赖：
   ```bash
   pnpm install
   ```

2. 确保已安装 Playwright 浏览器：
   ```bash
   pnpm exec playwright install chromium
   ```

3. 启动开发服务器：
   ```bash
   pnpm tauri dev
   ```
   
   或者只启动 Web 开发服务器：
   ```bash
   pnpm web:dev
   ```

### 运行所有 E2E 测试

```bash
pnpm exec playwright test
```

### 运行特定测试文件

```bash
# 运行语言切换测试
pnpm exec playwright test e2e/specs/i18n/language-switch.spec.ts

# 运行缓存验证测试
pnpm exec playwright test e2e/specs/i18n/cache-validation.spec.ts

# 运行所有 i18n 测试
pnpm exec playwright test e2e/specs/i18n/
```

### 运行特定测试用例

```bash
# 使用 grep 运行特定测试
pnpm exec playwright test -g "i18n-switch-001"
```

### 查看测试报告

```bash
# 生成并打开 HTML 报告
pnpm exec playwright show-report
```

### 调试测试

```bash
# 使用 UI 模式调试
pnpm exec playwright test --ui

# 使用 headed 模式（显示浏览器）
pnpm exec playwright test --headed

# 使用 debug 模式
pnpm exec playwright test --debug
```

## 测试覆盖

### i18n 测试套件

| 测试文件 | 测试 ID | 测试内容 |
|---------|---------|----------|
| language-switch.spec.ts | i18n-switch-* | 语言切换功能 |
| on-demand-loading.spec.ts | i18n-loading-* | 按需加载行为 |
| cache-validation.spec.ts | i18n-cache-* | 缓存验证和迁移 |
| toast-queue.spec.ts | i18n-toast-* | Toast 队列处理 |
| persistence.spec.ts | i18n-persist-* | 自动持久化 |
| ui-rendering.spec.ts | i18n-render-* | UI 文本渲染 |
| error-handling.spec.ts | i18n-error-* | 错误处理 |
| performance.spec.ts | i18n-perf-* | 性能验证 |

## 测试优先级

### P0 - 基础功能测试（必须通过）

1. `i18n-switch-001` - 基本语言切换
2. `i18n-loading-001` - 英文资源静态加载
3. `i18n-persist-001` - 语言切换后自动持久化
4. `i18n-render-001` - 主要页面文本渲染

### P1 - 核心功能测试

1. `i18n-loading-002` - 非英文语言按需加载
2. `i18n-cache-001` - localStorage 语言缓存读取
3. `i18n-cache-003` - 语言代码迁移
4. `i18n-toast-001` - 初始化期间 Toast 队列
5. `i18n-error-001` - 语言文件加载失败

### P2 - 扩展功能测试

1. `i18n-switch-002` - 快速连续语言切换
2. `i18n-loading-003` - 语言切换时的资源加载
3. `i18n-cache-004` - 四级降级策略验证
4. `i18n-perf-001` - 初始加载性能
5. `i18n-perf-002` - 语言切换性能

### P3 - 边界条件测试

1. `i18n-edge-001` - 不支持的语言代码
2. `i18n-edge-002` - 空语言代码
3. `i18n-edge-003` - 特殊字符语言代码
4. `i18n-edge-004` - 并发初始化

## 注意事项

1. **测试隔离**：每个测试都会清除 localStorage，确保测试独立性。

2. **网络模拟**：部分测试会模拟网络错误或延迟，测试错误处理逻辑。

3. **视口测试**：Toast 位置测试会切换桌面端和移动端视口。

4. **性能测试**：性能测试的阈值可能需要根据实际环境调整。

5. **选择器更新**：如果应用 UI 结构变化，可能需要更新测试中的选择器。

## 常见问题

### 测试超时

如果测试超时，可以增加 `playwright.config.ts` 中的 `timeout` 值。

### 选择器找不到元素

检查应用是否已更新 UI 结构，更新测试中的 `data-testid` 或其他选择器。

### 网络请求失败

确保开发服务器正在运行，且端口配置正确。

## 相关文档

- [测试计划](./specs/i18n.md)
- [i18n 设计文档](../../docs/design/i18n-system.md)
- [Playwright 文档](https://playwright.dev/)
