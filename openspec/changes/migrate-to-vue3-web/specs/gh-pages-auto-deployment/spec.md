# Spec Delta

## REMOVED Requirements

### Requirement: 版本同步
**Reason**: Tauri 桌面构建工作流（`build-and-release.yml`）随平台移除一并删除，不再存在需要与 Web 部署保持版本同步的桌面产物。
**Migration**: 无需迁移。版本 tag 触发 Web 部署的行为由既有"Tag 触发自动部署"需求继续覆盖；应用版本号此后仅由 `package.json` 定义，版本同步脚本不再更新 `tauri.conf.json` 与 `Cargo.toml`。
