import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import "fake-indexeddb/auto";
import { createI18nMockReturn } from "@/__test__/helpers/mocks/i18n";

/**
 * 集成测试设置文件
 * 配置全局测试钩子
 */

// 设置全局测试环境标识，用于优化加密性能
(globalThis as Record<string, unknown>).__VITEST__ = true;

// 将 i18n mock 工厂函数注册到 globalThis，供测试文件中的 vi.mock 工厂使用
// vi.mock 的工厂函数存在 hoisting 限制，无法使用常规 import
globalThis.__createI18nMockReturn = createI18nMockReturn;

// 扩展 Vitest 的 expect 断言（@testing-library/jest-dom）
expect.extend(matchers);
