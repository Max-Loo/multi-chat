/**
 * Playwright 测试配置
 *
 * 配置说明：
 * - 使用 Chrome 浏览器进行测试
 * - 基础 URL: http://localhost:1420 (Tauri dev server)
 * - 测试超时: 30秒
 * - 支持截图和 trace 调试
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // 测试目录
  testDir: "./e2e/specs",

  // 测试文件匹配模式
  testMatch: "**/*.spec.ts",

  // 全局输出目录（截图、视频、trace 等）
  outputDir: "e2e/test-results",

  // 全局超时设置
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  // 完全并行运行测试
  fullyParallel: false,

  // CI 环境下禁止 test.only
  forbidOnly: !!process.env.CI,

  // CI 环境下失败重试
  retries: process.env.CI ? 2 : 0,

  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: [
    ["html", { open: "never", outputFolder: "e2e/report/html" }],
    ["list"],
    ["json", { outputFile: "e2e/report/json/report.json" }], // JSON 报告
    ["junit", { outputFile: "e2e/report/junit/report.xml" }], // JUnit 格式
  ],

  // 全局设置
  use: {
    // 基础 URL
    baseURL: "http://localhost:1420",

    // 收集失败测试的 trace
    trace: "on-first-retry",

    // 截图配置
    screenshot: "only-on-failure",

    // 视频录制
    video: "retain-on-failure",

    // 操作超时
    actionTimeout: 10000,

    // 导航超时
    navigationTimeout: 15000,

    // 视口大小
    viewport: { width: 1280, height: 720 },
  },

  // 项目配置
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Web Server 配置（可选，如果需要自动启动 dev server）
  // webServer: {
  //   command: 'pnpm tauri dev',
  //   url: 'http://localhost:1420',
  //   timeout: 120000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
