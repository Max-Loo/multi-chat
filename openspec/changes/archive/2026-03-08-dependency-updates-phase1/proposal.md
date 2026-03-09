## Why

项目存在 **35 个过时的依赖包**，其中部分包含重要的安全补丁和 bug 修复。及时更新依赖可以：
- 获得安全修复和性能改进
- 保持依赖生态系统的健康
- 避免技术债务累积

采用**分阶段更新策略**降低风险，从低风险的补丁版本开始。

## What Changes

批量更新所有补丁版本依赖（patch 版本号变更），涉及 **35 个包**：

**核心框架**：
- `react` / `react-dom`: 19.2.0 → 19.2.4
- `@reduxjs/toolkit`: 2.9.1 → 2.11.2
- `react-router-dom`: 7.9.4 → 7.13.1
- `vite`: 7.1.11 → 7.3.1
- `tailwindcss`: 4.1.15 → 4.2.1

**AI SDK**：
- `ai`: 6.0.99 → 6.0.116
- `@ai-sdk/deepseek`: 2.0.20 → 2.0.24
- `@ai-sdk/moonshotai`: 2.0.5 → 2.0.10

**其他库**（完整列表见变更描述）：
- `dayjs`, `dompurify`, `markdown-it`, `i18next`, `lucide-react` 等

**开发依赖**：
- `@types/node`, `@types/react`, `autoprefixer`, `oxlint` 等

## Capabilities

### New Capabilities
无（此变更不引入新功能）

### Modified Capabilities
无（依赖更新不影响应用级别的功能需求）

## Impact

**受影响的文件**：
- `package.json` - 更新依赖版本号
- `pnpm-lock.yaml` - 自动更新锁定文件
- 无需修改应用代码

**测试策略**：
- 更新后运行完整测试套件：`pnpm test:all`
- 手动验证核心功能（聊天、模型管理、设置等）
- 检查控制台是否有警告或错误

**风险评估**：**低风险**
- 仅更新补丁版本（patch versions）
- 不涉及破坏性变更（breaking changes）
- 可在出现问题时快速回滚
