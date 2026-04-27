## 1. 测试文件创建与基础渲染

- [x] 1.1 创建 `src/__test__/pages/Model/CreateModel/components/ModelHeader.test.tsx`，配置 describe 块和基础 mock（`useResponsive`、`react-i18next`、`react-router-dom`、Redux store）
- [x] 1.2 编写桌面端测试：验证 `isMobile=false` 时仅渲染标题，不渲染返回按钮和菜单按钮

## 2. 移动端渲染与交互测试

- [x] 2.1 编写移动端渲染测试：验证 `isMobile=true` 时渲染返回按钮和菜单按钮
- [x] 2.2 编写返回按钮交互测试：验证点击返回按钮调用 `navigate("/model/table")`
- [x] 2.3 编写菜单按钮交互测试：验证点击菜单按钮 dispatch `toggleDrawer()` action

## 3. 验证

- [x] 3.1 运行测试确认全部通过
- [x] 3.2 检查 `ModelHeader.tsx` 覆盖率提升至行 90%+ / 分支 80%+
