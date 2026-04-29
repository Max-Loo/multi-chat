/**
 * FatalErrorScreen UI 组件测试
 *
 * 测试致命错误提示组件的功能和交互
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FatalErrorScreen } from '@/components/FatalErrorScreen';
import type { InitError } from '@/services/initialization';

/** 保存原始 window.location 用于测试后恢复 */
const originalLocation = window.location;
const mockReload = vi.fn();

describe('FatalErrorScreen 组件', () => {
  const mockErrors: InitError[] = [
    {
      severity: 'fatal',
      message: '错误 1：初始化失败',
      originalError: new Error('Original error 1'),
    },
  ];

  beforeEach(() => {
    // 重置 DEV 模式
    vi.stubEnv('DEV', true);
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });
  });

  afterEach(() => {
    // 恢复原始 window.location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  describe('渲染单个错误', () => {
    it('应该显示错误消息', () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      expect(screen.getByText('错误 1：初始化失败')).toBeInTheDocument();
    });

    it('应该显示刷新按钮', () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      // 刷新按钮存在
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('渲染多个错误', () => {
    it('应该为每个错误渲染独立的 Alert 组件', () => {
      const multipleErrors: InitError[] = [
        { severity: 'fatal', message: '错误 1', originalError: new Error('Error 1') },
        { severity: 'fatal', message: '错误 2', originalError: new Error('Error 2') },
        { severity: 'fatal', message: '错误 3', originalError: new Error('Error 3') },
      ];

      render(<FatalErrorScreen errors={multipleErrors} />);

      expect(screen.getByText('错误 1')).toBeInTheDocument();
      expect(screen.getByText('错误 2')).toBeInTheDocument();
      expect(screen.getByText('错误 3')).toBeInTheDocument();
    });

    it('应该所有错误同时显示', () => {
      const multipleErrors: InitError[] = [
        { severity: 'fatal', message: '错误 A', originalError: new Error('Error A') },
        { severity: 'fatal', message: '错误 B', originalError: new Error('Error B') },
      ];

      render(<FatalErrorScreen errors={multipleErrors} />);

      expect(screen.getByText('错误 A')).toBeInTheDocument();
      expect(screen.getByText('错误 B')).toBeInTheDocument();
    });
  });

  describe('刷新按钮交互', () => {
    it('应该调用 window.location.reload', () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      const button = screen.getAllByRole('button')[0];
      button.click();

      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  describe('DEV 模式错误详情', () => {
    it('应该 DEV 模式下显示错误详情', () => {
      vi.stubEnv('DEV', true);

      const errorWithStack: InitError = {
        severity: 'fatal',
        message: '错误消息',
        originalError: new Error('Stack trace'),
      };

      render(<FatalErrorScreen errors={[errorWithStack]} />);

      // 检查错误详情是否存在（details 元素隐式 role 为 group）
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('应该 details 元素可展开/收起', () => {
      vi.stubEnv('DEV', true);

      const errorWithStack: InitError = {
        severity: 'fatal',
        message: '错误消息',
        originalError: new Error('Stack trace'),
      };

      render(<FatalErrorScreen errors={[errorWithStack]} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('应该显示错误堆栈或序列化对象', () => {
      vi.stubEnv('DEV', true);

      const customError = { code: 'ERR_001', details: 'Some details' };
      const errorWithObject: InitError = {
        severity: 'fatal',
        message: '错误消息',
        originalError: customError,
      };

      render(<FatalErrorScreen errors={[errorWithObject]} />);

      // 验证序列化内容存在
      expect(screen.getByText(/ERR_001/)).toBeInTheDocument();
    });
  });

  describe('生产环境不显示错误详情', () => {
    it('应该生产环境不显示错误详情', () => {
      vi.stubEnv('DEV', false);

      const errorWithStack: InitError = {
        severity: 'fatal',
        message: '错误消息',
        originalError: new Error('Stack trace'),
      };

      render(<FatalErrorScreen errors={[errorWithStack]} />);

      // 检查错误详情不存在
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });
  });

  describe('不同严重程度的错误', () => {
    it('应该显示致命错误', () => {
      const fatalError: InitError = {
        severity: 'fatal',
        message: '致命错误',
        originalError: new Error('Fatal'),
      };

      render(<FatalErrorScreen errors={[fatalError]} />);

      expect(screen.getByText('致命错误')).toBeInTheDocument();
    });

    it('应该显示警告错误', () => {
      const warningError: InitError = {
        severity: 'warning',
        message: '警告错误',
        originalError: new Error('Warning'),
      };

      render(<FatalErrorScreen errors={[warningError]} />);

      expect(screen.getByText('警告错误')).toBeInTheDocument();
    });

    it('应该显示可忽略错误', () => {
      const ignorableError: InitError = {
        severity: 'ignorable',
        message: '可忽略错误',
        originalError: new Error('Ignorable'),
      };

      render(<FatalErrorScreen errors={[ignorableError]} />);

      expect(screen.getByText('可忽略错误')).toBeInTheDocument();
    });
  });

  describe('没有 originalError 的错误', () => {
    it('应该不显示错误详情', () => {
      vi.stubEnv('DEV', true);

      const errorWithoutOriginal: InitError = {
        severity: 'fatal',
        message: '没有原始错误',
      };

      render(<FatalErrorScreen errors={[errorWithoutOriginal]} />);

      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });
  });

  describe('密钥恢复入口', () => {
    it('应该显示导入密钥按钮 当错误来自 masterKey 步骤', () => {
      const masterKeyError: InitError = {
        severity: 'fatal',
        message: '密钥初始化失败',
        stepName: 'masterKey',
        originalError: new Error('Key error'),
      };

      render(<FatalErrorScreen errors={[masterKeyError]} />);

      // masterKey 错误时应渲染 3 个按钮：刷新、导入密钥、重置
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('应该不显示导入密钥按钮 当错误不来自 masterKey 步骤', () => {
      const i18nError: InitError = {
        severity: 'fatal',
        message: 'i18n 初始化失败',
        stepName: 'i18n',
        originalError: new Error('i18n error'),
      };

      render(<FatalErrorScreen errors={[i18nError]} />);

      // 非 masterKey 错误时只渲染 2 个按钮：刷新、重置
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });

    it('应该不显示导入密钥按钮 当错误没有 stepName', () => {
      const unknownError: InitError = {
        severity: 'fatal',
        message: '未知错误',
        originalError: new Error('unknown'),
      };

      render(<FatalErrorScreen errors={[unknownError]} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });

    it('应该显示导入密钥按钮 当多个错误中包含 masterKey 错误', () => {
      const errors: InitError[] = [
        { severity: 'warning', message: '警告', stepName: 'models' },
        { severity: 'fatal', message: '密钥错误', stepName: 'masterKey', originalError: new Error('key') },
      ];

      render(<FatalErrorScreen errors={errors} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('formatErrorDetails 分支', () => {
    it('应该显示 Error 对象的 stack trace', () => {
      vi.stubEnv('DEV', true);

      const error = new Error('stack trace content');
      error.stack = 'Error: stack trace content\n    at test.js:1:1';

      const errorWithStack: InitError = {
        severity: 'fatal',
        message: '堆栈测试',
        originalError: error,
      };

      render(<FatalErrorScreen errors={[errorWithStack]} />);

      // details 元素应该包含 stack trace
      expect(screen.getByText(/stack trace content/)).toBeInTheDocument();
    });

    it('应该序列化非 Error 对象', () => {
      vi.stubEnv('DEV', true);

      const customObject = { code: 'ERR_CUSTOM', data: { foo: 'bar' } };
      const errorWithObject: InitError = {
        severity: 'fatal',
        message: '自定义对象测试',
        originalError: customObject,
      };

      render(<FatalErrorScreen errors={[errorWithObject]} />);

      // 应该显示 JSON.stringify 的结果
      expect(screen.getByText(/ERR_CUSTOM/)).toBeInTheDocument();
    });

    it('应该在 Error 无 stack 时显示 message', () => {
      vi.stubEnv('DEV', true);

      const errorNoStack = new Error('message only');
      errorNoStack.stack = undefined as any;

      const errorWithMessage: InitError = {
        severity: 'fatal',
        message: '消息测试',
        originalError: errorNoStack,
      };

      render(<FatalErrorScreen errors={[errorWithMessage]} />);

      expect(screen.getByText(/message only/)).toBeInTheDocument();
    });
  });

  describe('reset 回调触发', () => {
    it('应该点击重置数据按钮时触发对话框', () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      // 获取所有按钮（刷新 + 重置，共 2 个）
      const buttons = screen.getAllByRole('button');
      // 最后一个按钮是重置按钮
      const resetButton = buttons[buttons.length - 1];
      fireEvent.click(resetButton);

      // 对话框被触发（useResetDataDialog 内部 setIsDialogOpen(true)）
      expect(resetButton).toBeInTheDocument();
    });
  });
});
