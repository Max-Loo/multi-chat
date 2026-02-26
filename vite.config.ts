import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// //@ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
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
      "@/test-helpers": path.resolve(__dirname, "./src/__test__/helpers/index"),
      "@/test-helpers/*": path.resolve(__dirname, "./src/__test__/helpers/*"),
    },
  },

  // Vitest 测试配置
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/__test__/setup.ts'],
    include: ['src/__test__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__test__/**',
        'src/__mock__/**',
        'src/main.tsx',
      ],
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
        rewrite: (path) => path.replace(/^\/deepseek/, ''),
      },
      '/kimi': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/kimi/, ''),
      },
      '/zhipuai-coding-plan': {
        target: 'https://open.bigmodel.cn/api/coding/paas/v4',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/zhipuai-coding-plan/, ''),
      },
      '/zhipuai': {
        target: 'https://open.bigmodel.cn/api/paas/v4',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/zhipuai/, ''),
      },
    },
  },
}));
