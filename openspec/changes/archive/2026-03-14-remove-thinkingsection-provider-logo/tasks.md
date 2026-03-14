## 1. 移除 ThinkingSection 组件中的 provider 相关代码

- [x] 1.1 移除 `ModelProvider` 接口定义
- [x] 1.2 从 `ThinkingSectionProps` 接口中移除 `provider` 属性
- [x] 1.3 从组件函数参数中移除 `provider` 解构
- [x] 1.4 移除供应商 logo 的 `<img>` 渲染逻辑

## 2. 更新调用方代码

- [x] 2.1 查找并更新所有传入 `provider` 属性的 `ThinkingSection` 调用
- [x] 2.2 验证 TypeScript 编译通过

## 3. 测试验证

- [x] 3.1 运行单元测试确保无回归
- [x] 3.2 手动验证组件功能正常（折叠/展开、加载动画）
