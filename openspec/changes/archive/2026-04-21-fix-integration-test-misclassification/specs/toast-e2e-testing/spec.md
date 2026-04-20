## REMOVED Requirements

### Requirement: Toast E2E 测试文件
**Reason**: `toast-e2e.integration.test.tsx` 使用 spy 验证自身调用（循环论证），不验证用户可见行为，与 `toast-system.integration.test.tsx` 高度重复。文件名 "e2e" 具有误导性（未使用真实浏览器环境）。
**Migration**: Toast 集成测试由重写后的 `toast-system.integration.test.tsx` 覆盖。
