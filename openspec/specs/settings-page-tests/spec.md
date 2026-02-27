# 设置页面测试规格

## 能力概述

为设置页面（`src/pages/Setting/`）创建全面的单元测试，包括通用设置页面、语言设置、模型供应商配置等核心功能。

## 需求

### 功能需求

**REQ-1: 设置页面主组件（SettingPage）**
- 应正确渲染设置侧边栏和内容区域
- 应使用 React Router 的 `Outlet` 渲染子路由
- 应支持侧边栏导航到不同的设置页面

**REQ-2: 通用设置页面（GeneralSetting）**
- 应正确渲染语言设置和模型供应商设置
- 应支持滚动容器的自适应滚动条
- 应处理滚动事件

**REQ-3: 语言设置（LanguageSetting）**
- 应显示当前选中的语言
- 应提供语言选择下拉菜单（中文、英文）
- 应支持语言切换并更新 Redux store
- 应使用国际化文本显示标签

**REQ-4: 模型供应商设置（ModelProviderSetting）**
- 应显示所有可用的模型供应商列表
- 应支持搜索过滤模型供应商
- 应支持添加新的 API Key
- 应支持编辑现有 API Key
- 应支持删除 API Key
- 应显示 API Key 的加密状态
- 应支持刷新模型供应商数据
- 应显示加载状态和错误状态

**REQ-5: ProviderCard 组件**
- 应显示供应商名称和图标
- 应显示该供应商下的所有模型
- 应支持展开/收起模型列表
- 应显示模型的配置状态（已配置/未配置）
- 应支持添加模型的 API Key
- 应支持编辑模型的 API Key

### 测试覆盖需求

**TEST-1: SettingPage 主组件测试（新增）**
- 测试组件正确渲染侧边栏和内容区
- 测试侧边栏导航功能
- 测试 Outlet 渲染子路由

**TEST-2: GeneralSetting 组件测试（新增）**
- 测试组件正确渲染语言设置和模型供应商设置
- 测试滚动容器的滚动事件处理
- 测试自适应滚动条功能

**TEST-3: LanguageSetting 组件测试（新增）**
- 测试渲染当前选中的语言
- 测试语言选择下拉菜单的展开和收起
- 测试选择语言后更新 Redux store
- 测试国际化文本的正确显示
- 测试语言选项包括中文和英文

**TEST-4: ModelProviderSetting 组件测试（新增）**
- 测试渲染所有可用的模型供应商
- 测试搜索过滤功能
- 测试刷新模型供应商数据
- 测试显示加载状态
- 测试显示错误状态
- 测试空列表状态

**TEST-5: ProviderCard 组件测试（已有部分，需增强）**
- 🆕 测试展开/收起模型列表
- 🆕 测试显示供应商名称和图标
- 🆕 测试显示模型的配置状态
- 🆕 测试添加 API Key 功能
- 🆕 测试编辑 API Key 功能
- 🆕 测试删除 API Key 功能
- 🆕 测试 API Key 的加密状态显示

**TEST-6: API Key 管理测试（新增）**
- 测试添加 API Key 的表单验证
- 测试 API Key 加密存储
- 测试 API Key 解密显示
- 测试 API Key 删除确认
- 测试 API Key 编辑功能

### 质量需求

- **代码覆盖率**：设置页面相关组件的语句覆盖率 ≥ 60%
- **测试可靠性**：所有测试应独立运行，不依赖执行顺序
- **Mock 策略**：
  - Mock React Router hooks（`useNavigate`、`useLocation`）
  - Mock Redux store 和 actions
  - Mock 国际化（`useTranslation`）
  - Mock `@ant-design/x` 组件（如果使用）
- **测试速度**：每个测试用例执行时间 < 150ms

## 依赖

- **React Testing Library**: 用于组件渲染和交互测试
- **Vitest**: 测试运行器
- **项目测试辅助工具**：`@/test-helpers` 中的 mock 工厂和辅助函数
- **现有测试文件**：`src/__test__/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.test.tsx`（12 个测试）
- **现有测试文件**：`src/__test__/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/__tests__/ProviderCard.test.tsx`

## 成功标准

- 所有测试用例通过（包括现有的测试）
- 新增 15-25 个测试用例
- 代码覆盖率达到目标（≥ 60%）
- 测试文件位于 `src/__test__/pages/Setting/` 目录
- 测试不产生控制台错误或警告
- Mock 策略正确，不触发第三方库兼容性问题
