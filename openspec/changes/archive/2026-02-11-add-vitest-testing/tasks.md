# 实施任务清单

## 1. 依赖安装

- [x] 1.1 安装 Vitest 核心包和 UI 界面
  ```bash
  pnpm add -D vitest @vitest/ui @vitest/coverage-v8
  ```
- [x] 1.2 安装 Testing Library 系列工具
  ```bash
  pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
- [x] 1.3 安装 happy-dom DOM 环境
  ```bash
  pnpm add -D happy-dom
  ```

## 2. 配置 Vitest

- [x] 2.1 修改 `vite.config.ts`，添加 `test` 配置块
  - 设置 `environment: 'happy-dom'`
  - 配置 `include` 为 `src/__test__/**/*.{test,spec}.{ts,tsx}`
  - 配置 `coverage` provider 为 `v8`，包含 `src/` 目录，排除 `__test__` 和 `__mock__`
- [x] 2.2 创建全局测试设置文件 `src/__test__/setup.ts`
  - 导入 `@testing-library/jest-dom`
  - 配置自动 Mock Tauri 兼容层模块

## 3. 创建目录结构

- [x] 3.1 创建测试代码目录 `src/__test__/`
  ```bash
  mkdir -p src/__test__/{components,utils,fixtures}
  ```
- [x] 3.2 创建 Mock 数据目录 `src/__mock__/`
  ```bash
  mkdir -p src/__mock__/{data,tauriCompat}
  ```

## 4. 添加测试脚本

- [x] 4.1 在 `package.json` 中添加 `test` 脚本（监听模式）
- [x] 4.2 在 `package.json` 中添加 `test:run` 脚本（单次运行）
- [x] 4.3 在 `package.json` 中添加 `test:ui` 脚本（UI 界面）
- [x] 4.4 在 `package.json` 中添加 `test:coverage` 脚本（覆盖率报告）

## 5. 创建 Tauri API Mock

- [x] 5.1 创建 `src/__mock__/tauriCompat/shell.ts`
  - Mock `shell.open()` 方法
  - Mock `Command.create()` 工厂函数
- [x] 5.2 创建 `src/__mock__/tauriCompat/os.ts`
  - Mock `locale()` 方法
- [x] 5.3 创建 `src/__mock__/tauriCompat/http.ts`
  - Mock `fetch()` 函数
  - Mock `getFetchFunc()` 函数
- [x] 5.4 创建 `src/__mock__/tauriCompat/store.ts`
  - Mock `createLazyStore()` 函数
  - Mock `Store` 类方法
- [x] 5.5 创建 `src/__mock__/tauriCompat/keyring.ts`
  - Mock `getPassword()` 和 `setPassword()` 方法

## 6. 编写示例测试

- [x] 6.1 编写组件测试 `src/__test__/components/Button.test.tsx`
  - 测试组件渲染
  - 测试用户交互（点击事件）
- [x] 6.2 编写工具函数测试 `src/__test__/utils/crypto.test.ts`
  - 测试 `encryptField()` 函数
  - 测试 `decryptField()` 函数
- [x] 6.3 编写 Mock 数据示例 `src/__mock__/data/testModels.ts`
  - 创建测试用的模型数据

## 7. 验证测试运行

- [x] 7.1 运行所有测试并确保通过（15 个测试全部通过）
  ```bash
  pnpm test:run
  ```
- [x] 7.2 生成覆盖率报告（覆盖率报告已生成，crypto.ts 达到 94.11%）
  ```bash
  pnpm test:coverage
  ```
- [x] 7.3 启动测试 UI 界面（命令已验证可执行）
  ```bash
  pnpm test:ui
  ```
- [x] 7.4 验证监听模式工作正常（配置已验证）
  ```bash
  pnpm test
  ```

## 8. 文档更新

- [x] 8.1 在 AGENTS.md 中添加测试相关说明
  - 如何运行测试
  - 如何编写测试
  - 测试覆盖率要求
- [x] 8.2 更新 README.md（如有必要）
  - 添加测试章节说明（跳过，AGENTS.md 已包含详细信息）

## 9. 代码质量检查

- [x] 9.1 运行 `pnpm lint` 确保代码符合规范
- [x] 9.2 运行 `pnpm tsc` 确保类型检查通过
