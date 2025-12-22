import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock Tauri Store plugin
vi.mock('@tauri-apps/plugin-store', () => ({
  Store: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    save: vi.fn(),
  })),
  LazyStore: class {
    path: string;
    options: Record<string, unknown>;

    constructor(path: string, options: Record<string, unknown> = {}) {
      this.path = path;
      this.options = options;
    }

    get = vi.fn();
    set = vi.fn();
    save = vi.fn();
  },
}));

// Mock Tauri Stronghold plugin
vi.mock('@tauri-apps/plugin-stronghold', () => ({
  Stronghold: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
    createVault: vi.fn(),
    getVault: vi.fn(),
  })),
}));

// Global test utilities
(global as unknown as Record<string, unknown>).createMockStore = (initialState: Record<string, unknown> = {}) => {
  return {
    getState: () => initialState,
    dispatch: vi.fn(),
    subscribe: vi.fn(),
    replaceReducer: vi.fn(),
  };
};

// Mock console methods in tests
(global as unknown as Record<string, unknown>).console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};