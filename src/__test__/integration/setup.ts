import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import "fake-indexeddb/auto";

/**
 * 集成测试设置文件
 * 配置全局测试钩子
 */

// 设置全局测试环境标识，用于优化加密性能
(globalThis as Record<string, unknown>).__VITEST__ = true;

// 扩展 Vitest 的 expect 断言（@testing-library/jest-dom）
expect.extend(matchers);
