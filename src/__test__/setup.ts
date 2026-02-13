import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 Vitest 的 expect 断言
expect.extend(matchers);

// 自动 Mock Tauri 兼容层模块
vi.mock('@/utils/tauriCompat/shell');
vi.mock('@/utils/tauriCompat/os');
vi.mock('@/utils/tauriCompat/http');
vi.mock('@/utils/tauriCompat/store');
// 注意：keyring 模块在 keyring.test.ts 中需要真实实现，不在这里 mock