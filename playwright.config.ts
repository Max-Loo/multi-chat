import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 测试配置
 *
 * 测试模式：Web 模式（非 Tauri 模式）
 * - 使用 pnpm web:dev 启动应用
 * - 测试 URL: http://localhost:1420
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',

  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',

  // 完全并行运行（默认）
  // 如果遇到稳定性问题，可以设置为 false
  fullyParallel: false,

  // 单线程执行（workers: 1）
  // 原因：确保测试之间完全隔离，避免状态泄漏
  workers: 1,

  // 失败重试次数
  retries: 2,

  // 超时时间（30 秒）
  timeout: 30000,

  // 测试失败时的行为
  use: {
    // 基础 URL
    baseURL: 'http://localhost:1420',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 失败时录制视频
    video: 'retain-on-failure',

    // 失败时保存 trace
    trace: 'retain-on-failure',

    // 浏览器视口大小
    viewport: { width: 1280, height: 720 },

    // 忽略 HTTPS 错误
    ignoreHTTPSErrors: true,
  },

  // Web 服务器配置
  webServer: {
    // 启动命令
    command: 'pnpm web:dev',

    // 启动端口
    port: 1420,

    // 启动超时
    timeout: 120000,

    // 重试启动
    reuseExistingServer: !process.env.CI,
  },

  // 测试输出目录
  outputDir: 'test-results',

  // 测试报告配置
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
