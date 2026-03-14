import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// //@ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  // GitHub Pages 子路径部署支持：开发环境使用根路径，生产环境使用 /multi-chat/
  base: process.env.NODE_ENV === 'production' ? '/multi-chat/' : '/',
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
    visualizer({
      // open: true, // 自动打开浏览器
      gzipSize: true, // 显示 gzip 后大小
      brotliSize: true,
      filename: 'dist/stats.html', // 生成文件
    }),
  ],

  // 配置路径别名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/test-helpers": path.resolve(__dirname, "./src/__test__/helpers/index.ts"),
      "@/test-helpers/*": path.resolve(__dirname, "./src/__test__/helpers/*"),
      // 配置 highlight.js 别名，用于动态导入
      "/@highlight.js": path.resolve(__dirname, "./node_modules/highlight.js"),
    },
  },

  // Vitest 测试配置
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/__test__/setup.ts'],
    include: ['src/__test__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'src/__test__/integration/**'],

    // 忽略未处理的 Promise rejection（测试错误处理场景时会故意创建错误）
    dangerouslyIgnoreUnhandledErrors: true,

    // 并行执行配置
    pool: 'threads',
    singleThread: false,
    minThreads: 1,
    maxThreads: 1, // 限制为单线程，确保 mock 正确工作
    useAtomics: true, // 使用 Atomics API 提升性能

    // 优化依赖项预构建
    deps: {
      optimizer: {
        web: {
          include: ['antd', '@ant-design/x'],
        },
      },
    },

    // 测试文件匹配模式
    testTimeout: 10000, // 10 秒超时
    hookTimeout: 10000,
    teardownTimeout: 10000,

    // 慢速测试标记
    benchmark: {
      include: ['**/*.bench.ts'],
    },

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__test__/**',
        'src/__mock__/**',
        'src/main.tsx',
        'src/__test__/setup.ts',
      ],
      // 覆盖率阈值
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
      // 临时目录
      tempDirectory: './coverage/tmp',
    },
  },

  // 构建配置
  build: {
    // 设置 chunk 大小警告限制为 500 KB
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
      output: {
        // 手动代码分割配置（大型库单独分包，其他由 Rolldown 自动处理）
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React 核心框架
            if (/node_modules\/(react(?![\w-])|react-dom(?![\w-]))/.test(id)) {
              return 'vendor-react';
            }
            // Redux 状态管理
            if (/node_modules\/(@reduxjs|react-redux|redux|immer|reselect)/.test(id)) {
              return 'vendor-redux';
            }
            // Router 路由系统
            if (/node_modules\/(react-router|@remix-run)/.test(id)) {
              return 'vendor-router';
            }
            // Ant Design X 组件库
            if (/node_modules\/@ant-design\/x/.test(id)) {
              return 'vendor-antd-x';
            }
            // Highlight.js 代码高亮
            if (/node_modules\/highlight\.js/.test(id)) {
              return 'vendor-highlight';
            }
            // AI SDK
            if (/node_modules\/(ai(@|$)|@ai-sdk)/.test(id)) {
              return 'vendor-ai';
            }
            // 其他依赖由 Rolldown 自动处理（返回 undefined）
          }
        },
      },
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      // 匹配 /deepseek/xxx
      '/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        secure: true,
        // 去掉前缀再转发
        rewrite: (requestPath) => requestPath.replace(/^\/deepseek/, ''),
      },
      '/kimi': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/kimi/, ''),
      },
      '/zhipuai-coding-plan': {
        target: 'https://open.bigmodel.cn/api/coding/paas/v4',
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/zhipuai-coding-plan/, ''),
      },
      '/zhipuai': {
        target: 'https://open.bigmodel.cn/api/paas/v4',
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/zhipuai/, ''),
      },
    },
  },
}));
