import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { readFileSync } from "fs";

// 读取 package.json 获取版本号
const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "./package.json"), "utf-8"),
);

// //@ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  // GitHub Pages 部署通过 BASE_PATH 环境变量设置子路径，默认使用根路径
  base: process.env.BASE_PATH || "/",
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    visualizer({
      // open: true, // 自动打开浏览器
      gzipSize: true, // 显示 gzip 后大小
      brotliSize: true,
      filename: "dist/stats.html", // 生成文件
    }),
  ],

  // 注入版本号到全局变量
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },

  // 配置路径别名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/test-helpers": path.resolve(
        __dirname,
        "./src/__test__/helpers/index.ts",
      ),
      "@/test-helpers/*": path.resolve(__dirname, "./src/__test__/helpers/*"),
      // 配置 highlight.js 别名，用于动态导入
      "/@highlight.js": path.resolve(__dirname, "./node_modules/highlight.js"),
    },
  },

  // Vitest 测试配置
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/__test__/setup.ts"],
    include: ["src/__test__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "src/__test__/integration/**"],

    // 忽略未处理的 Promise rejection（测试错误处理场景时会故意创建错误）
    dangerouslyIgnoreUnhandledErrors: true,

    // 并行执行配置
    pool: "threads",
    singleThread: false,
    minThreads: 1,
    maxThreads: 1, // 限制为单线程，确保 mock 正确工作
    useAtomics: true, // 使用 Atomics API 提升性能

    // 优化依赖项预构建
    deps: {
      optimizer: {
        web: {
          // 预构建 CommonJS/ESM 模块以解决兼容性问题
          include: [
            "use-sync-external-store",
            "cookie",
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react-redux",
            "react-remove-scroll",
          ],
        },
      },
    },

    // 测试文件匹配模式
    testTimeout: 10000, // 10 秒超时
    hookTimeout: 10000,
    teardownTimeout: 10000,

    // 慢速测试标记
    benchmark: {
      include: ["**/*.bench.ts"],
    },

    // 覆盖率配置
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/__test__/**",
        "src/__mock__/**",
        "src/main.tsx",
        "src/__test__/setup.ts",
      ],
      // 覆盖率阈值
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
      // 临时目录
      tempDirectory: "./coverage/tmp",
    },
  },

  // 构建配置
  build: {
    // 通过环境变量 MINIFY=false 禁用代码混淆
    minify: process.env.MINIFY !== "false",
    // 设置 chunk 大小警告限制为 500 KB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 手动代码分割配置
        manualChunks: (id) => {
          // chunk-init: 初始化 UI 组件 + initSteps 配置（~60KB gzip 目标）
          if (
            id.includes("config/initSteps") ||
            id.includes("components/InitializationController") ||
            id.includes("components/AnimatedLogo") ||
            id.includes("components/canvas-logo") ||
            id.includes("components/FatalErrorScreen") ||
            id.includes("components/NoProvidersAvailable") ||
            id.includes("components/ui/progress")
          ) {
            return "chunk-init";
          }

          // 只处理 node_modules 中的依赖
          if (id.includes("node_modules")) {
            // React 及其依赖（包括 scheduler, loose-envify 等，避免循环依赖）
            if (
              /\/node_modules\/(react|react-dom|scheduler|loose-envify)(?:\/|$|\.js)/.test(
                id,
              )
            ) {
              return "vendor-react";
            }

            // Redux 相关（包含 Redux Toolkit、React-Redux、Redux 核心、Immer、Reselect）
            if (
              id.includes("@reduxjs") ||
              id.includes("react-redux") ||
              id.includes("redux") ||
              id.includes("immer") ||
              id.includes("reselect")
            ) {
              return "vendor-redux";
            }

            // Router 相关（React Router、@remix-run）
            if (id.includes("react-router") || id.includes("@remix-run")) {
              return "vendor-router";
            }

            // i18next 国际化库
            if (id.includes("i18next") || id.includes("react-i18next")) {
              return "vendor-i18n";
            }

            // Zod 数据验证库
            if (id.includes("zod")) {
              return "vendor-zod";
            }

            // Markdown 和代码高亮库
            if (id.includes("markdown-it") || id.includes("dompurify")) {
              return "vendor-markdown";
            }

            // Highlight.js 核心库
            if (id.includes("highlight.js/lib/core")) {
              return "vendor-highlight-core";
            }

            // Highlight.js 预加载语言（15 种常见语言）
            if (id.includes("highlight.js/lib/languages")) {
              const preloadedLanguages = [
                "javascript",
                "typescript",
                "python",
                "java",
                "cpp",
                "xml",
                "css",
                "bash",
                "json",
                "markdown",
                "sql",
                "go",
                "rust",
                "yaml",
                "csharp",
              ];

              const isPreloaded = preloadedLanguages.some((lang) =>
                id.includes(`/languages/${lang}.js`),
              );

              if (isPreloaded) {
                return "vendor-highlight-core";
              }

              // 其他语言包动态分割
              return "vendor-highlight-languages";
            }

            // Vercel AI SDK
            if (id.includes("ai") || id.includes("@ai-sdk")) {
              return "vendor-ai";
            }

            // lucide-react 图标库
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            // Radix UI 组件库
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }

            // UI 工具库（class-variance-authority, clsx, tailwind-merge）
            if (
              id.includes("class-variance-authority") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge")
            ) {
              return "vendor-ui-utils";
            }

            // Tauri 插件
            if (
              id.includes("@tauri-apps/plugin-") ||
              id.includes("tauri-plugin-")
            ) {
              return "vendor-tauri";
            }

            // TanStack 库
            if (id.includes("@tanstack")) {
              return "vendor-tanstack";
            }

            // 其他所有 node_modules 依赖
            return "vendor";
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
      "/deepseek": {
        target: "https://api.deepseek.com",
        changeOrigin: true,
        secure: true,
        // 去掉前缀再转发
        rewrite: (requestPath) => requestPath.replace(/^\/deepseek/, ""),
      },
      "/kimi": {
        target: "https://api.moonshot.cn",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/kimi/, ""),
      },
      "/zhipuai-coding-plan": {
        target: "https://open.bigmodel.cn/api/coding/paas/v4",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) =>
          requestPath.replace(/^\/zhipuai-coding-plan/, ""),
      },
      "/zhipuai": {
        target: "https://open.bigmodel.cn/api/paas/v4",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/zhipuai/, ""),
      },
    },
  },
}));
