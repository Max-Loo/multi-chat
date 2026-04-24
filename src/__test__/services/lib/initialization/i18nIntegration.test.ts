/**
 * i18n 初始化集成测试
 *
 * 测试 i18n 按需加载的完整初始化流程、系统语言切换和错误降级场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InitializationManager } from '@/services/initialization/InitializationManager';
import { initI18n, changeAppLanguage, getLocalesResources } from '@/services/i18n';
import type { InitStep } from '@/services/initialization';

// Mock getDefaultAppLanguage
vi.mock('@/services/global', () => ({
  getDefaultAppLanguage: vi.fn().mockResolvedValue('en'),
}));

describe('i18n 初始化集成测试', () => {
  let manager: InitializationManager;

  beforeEach(() => {
    manager = new InitializationManager();
  });

  describe('完整的初始化流程（i18n + 其他步骤）', () => {
    it('应该成功执行包含 i18n 步骤的完整初始化', async () => {
      const mockSteps = [
        {
          name: 'i18n',
          critical: true,
          execute: async () => {
            await initI18n();
          },
          onError: (error: unknown) => ({
            severity: 'fatal' as const,
            message: 'i18n 初始化失败',
            originalError: error,
          }),
        },
        {
          name: 'mockStep',
          critical: false,
          execute: vi.fn().mockResolvedValue(undefined),
          onError: (error: unknown) => ({
            severity: 'warning' as const,
            message: 'Mock step 失败',
            originalError: error,
          }),
        },
      ] as unknown as InitStep[];

      const result = await manager.runInitialization({ steps: mockSteps });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toContain('i18n');
      expect(result.completedSteps).toContain('mockStep');
    });

    it('应该按依赖顺序执行初始化步骤', async () => {
      let executionOrder: string[] = [];

      const mockSteps = [
        {
          name: 'i18n',
          critical: true,
          execute: async () => {
            executionOrder.push('i18n');
            await initI18n();
          },
          onError: (error: unknown) => ({
            severity: 'fatal' as const,
            message: 'i18n 初始化失败',
            originalError: error,
          }),
        },
        {
          name: 'dependsOnI18n',
          critical: false,
          dependencies: ['i18n'],
          execute: async () => {
            executionOrder.push('dependsOnI18n');
          },
          onError: (error: unknown) => ({
            severity: 'warning' as const,
            message: '依赖步骤失败',
            originalError: error,
          }),
        },
      ] as unknown as InitStep[];

      await manager.runInitialization({ steps: mockSteps });

      expect(executionOrder).toEqual(['i18n', 'dependsOnI18n']);
    });
  });

  describe('初始化完成后验证资源状态', () => {
    it('应该成功初始化并加载英文资源', async () => {
      await initI18n();

      // 验证英文资源已加载
      const resources = getLocalesResources();
      expect(resources).toHaveProperty('en');
      expect(typeof resources.en.translation).toBe('object');
    });

    it('应该返回翻译函数', async () => {
      const t = await initI18n();

      // 验证返回了翻译函数
      expect(typeof t).toBe('function');
    });
  });

  describe('语言切换功能验证', () => {
    it('应该在切换到已缓存的英文时返回成功', async () => {
      await initI18n();

      const result = await changeAppLanguage('en');

      expect(result).toEqual({ success: true });
    });
  });

  describe('没有致命错误时应用成功启动', () => {
    it('应该在非关键步骤失败时继续启动应用', async () => {
      const mockSteps = [
        {
          name: 'i18n',
          critical: true,
          execute: async () => {
            await initI18n();
          },
          onError: (error: unknown) => ({
            severity: 'fatal' as const,
            message: 'i18n 初始化失败',
            originalError: error,
          }),
        },
        {
          name: 'nonCritical',
          critical: false,
          execute: vi.fn().mockRejectedValue(new Error('Non-critical error')),
          onError: (error: unknown) => ({
            severity: 'warning' as const,
            message: '非关键步骤失败',
            originalError: error,
          }),
        },
      ] as unknown as InitStep[];

      const result = await manager.runInitialization({ steps: mockSteps });

      // 初始化应该成功（非关键步骤失败不阻塞）
      expect(result.success).toBe(true);
      expect(result.completedSteps).toContain('i18n');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('应该在所有步骤成功时成功启动应用', async () => {
      const mockSteps = [
        {
          name: 'i18n',
          critical: true,
          execute: async () => {
            await initI18n();
          },
          onError: (error: unknown) => ({
            severity: 'fatal' as const,
            message: 'i18n 初始化失败',
            originalError: error,
          }),
        },
        {
          name: 'otherStep',
          critical: false,
          execute: vi.fn().mockResolvedValue(undefined),
          onError: (error: unknown) => ({
            severity: 'warning' as const,
            message: '其他步骤失败',
            originalError: error,
          }),
        },
      ] as unknown as InitStep[];

      const result = await manager.runInitialization({ steps: mockSteps });

      expect(result.success).toBe(true);
      expect(result.completedSteps.length).toBe(2);
      expect(result.warnings.length).toBe(0);
      expect(result.fatalErrors.length).toBe(0);
    });
  });
});

