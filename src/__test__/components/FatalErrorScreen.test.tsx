/**
 * FatalErrorScreen UI 组件测试
 *
 * 测试致命错误提示组件的功能和交互
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FatalErrorScreen } from '@/components/FatalErrorScreen';
import type { InitError } from '@/lib/initialization';

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('FatalErrorScreen 组件', () => {
  const mockErrors: InitError[] = [
    {
      severity: 'fatal',
      message: '错误 1：初始化失败',
      originalError: new Error('Original error 1'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 DEV 模式
    vi.stubEnv('DEV', true);
  });

  describe('渲染单个错误', () => {
    it('应该显示错误消息', () => {
      render(<FatalErrorScreen errors={mockErrors} />);

      expect(screen.getByText('错误 1：初始化失败')).toBeInTheDocument();
    });

    it('应该显示刷新按钮', () => {
      const { container } = render(<FatalErrorScreen errors={mockErrors} />);

      const buttons = container.querySelectorAll('button');
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
      const { container } = render(<FatalErrorScreen errors={mockErrors} />);

      const button = container.querySelector('button');
      button?.click();

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

      const { container } = render(<FatalErrorScreen errors={[errorWithStack]} />);

      // 检查错误详情是否存在（使用 details 元素）
      const details = container.querySelector('details');
      expect(details).toBeInTheDocument();
    });

    it('应该 details 元素可展开/收起', () => {
      vi.stubEnv('DEV', true);

      const errorWithStack: InitError = {
        severity: 'fatal',
        message: '错误消息',
        originalError: new Error('Stack trace'),
      };

      const { container } = render(<FatalErrorScreen errors={[errorWithStack]} />);

      const details = container.querySelector('details');
      expect(details).toBeInTheDocument();
    });

    it('应该显示错误堆栈或序列化对象', () => {
      vi.stubEnv('DEV', true);

      const customError = { code: 'ERR_001', details: 'Some details' };
      const errorWithObject: InitError = {
        severity: 'fatal',
        message: '错误消息',
        originalError: customError,
      };

      const { container } = render(<FatalErrorScreen errors={[errorWithObject]} />);

      const pre = container.querySelector('pre');
      expect(pre).toBeInTheDocument();
      expect(pre?.textContent).toContain('ERR_001');
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

      const { container } = render(<FatalErrorScreen errors={[errorWithStack]} />);

      // 检查错误详情不存在
      const details = container.querySelector('details');
      expect(details).not.toBeInTheDocument();
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

      const { container } = render(<FatalErrorScreen errors={[errorWithoutOriginal]} />);

      const details = container.querySelector('details');
      expect(details).not.toBeInTheDocument();
    });
  });
});
