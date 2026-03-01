import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 集成测试配置
    setupFiles: ['./src/__test__/integration/setup.ts'],
    testTimeout: 30000,
    maxConcurrency: 1,
    isolate: true,

    // 环境
    environment: 'happy-dom',
    globals: true,

    // 覆盖率
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__test__/',
        'dist/',
        'src-tauri/',
      ],
    },

    // 仅运行集成测试
    include: ['src/__test__/integration/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
