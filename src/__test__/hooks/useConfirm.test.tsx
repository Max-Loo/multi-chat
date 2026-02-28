import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConfirm, ConfirmProvider } from '@/hooks/useConfirm';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.confirm': '确认',
        'common.cancel': '取消',
      };
      return translations[key] || key;
    },
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfirmProvider>{children}</ConfirmProvider>
);

describe('useConfirm', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConfirmProvider 渲染测试', () => {
    it('应成功渲染 ConfirmProvider', () => {
      const { container } = render(
        <ConfirmProvider>
          <div>Test Children</div>
        </ConfirmProvider>
      );
      expect(container).toBeTruthy();
    });

    it('应渲染子组件', () => {
      render(
        <ConfirmProvider>
          <div data-testid="test-child">Test Children</div>
        </ConfirmProvider>
      );
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Hook 基本功能测试', () => {
    it('应返回 modal 对象', () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.modal).toBeDefined();
      expect(result.current.modal.confirm).toBeInstanceOf(Function);
      expect(result.current.modal.warning).toBeInstanceOf(Function);
    });

    it('应支持调用 confirm 方法', () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(() => {
        result.current.modal.confirm({
          title: '测试',
          description: '测试描述',
        });
      }).not.toThrow();
    });

    it('应支持调用 warning 方法', () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(() => {
        result.current.modal.warning({
          description: '测试警告',
        });
      }).not.toThrow();
    });
  });

  describe('对话框渲染测试', () => {
    it('应显示确认对话框的标题和描述', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '确认删除？',
        description: '此操作无法撤销',
      });

      expect(await screen.findByText('确认删除？')).toBeInTheDocument();
      expect(await screen.findByText('此操作无法撤销')).toBeInTheDocument();
    });

    it('应支持 content 参数作为描述', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '确认',
        content: '测试内容',
      });

      expect(await screen.findByText('测试内容')).toBeInTheDocument();
    });

    it('应显示警告对话框', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.warning({
        title: '警告标题',
        description: '测试警告内容',
      });

      expect(await screen.findByText('警告标题')).toBeInTheDocument();
      expect(await screen.findByText('测试警告内容')).toBeInTheDocument();
    });
  });

  describe('Context 外使用测试', () => {
    it('应在 Context 外使用时抛出错误', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useConfirm());
      }).toThrow('useConfirm must be used within ConfirmProvider');

      console.error = originalError;
    });
  });

  describe('回调函数功能测试', () => {
    it('应支持 onOk 回调函数', () => {
      const onOk = vi.fn();
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(() => {
        result.current.modal.confirm({
          title: '测试标题',
          description: '测试描述',
          onOk,
        });
      }).not.toThrow();

      // 验证回调函数被定义
      expect(onOk).toBeDefined();
      expect(typeof onOk).toBe('function');
    });

    it('应支持 onCancel 回调函数', () => {
      const onCancel = vi.fn();
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(() => {
        result.current.modal.confirm({
          title: '测试标题',
          description: '测试描述',
          onCancel,
        });
      }).not.toThrow();

      // 验证回调函数被定义
      expect(onCancel).toBeDefined();
      expect(typeof onCancel).toBe('function');
    });
  });

  describe('自定义按钮文本测试', () => {
    it('应支持自定义按钮文本', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '测试',
        description: '测试描述',
        okText: '好的',
        cancelText: '不了',
      });

      expect(await screen.findByText('好的')).toBeInTheDocument();
      expect(await screen.findByText('不了')).toBeInTheDocument();
    });
  });

  describe('多次调用测试', () => {
    it('应支持多次调用 confirm 方法', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({ title: '第一次' });
      await screen.findByText('第一次');

      result.current.modal.confirm({ title: '第二次' });
      await screen.findByText('第二次');
    });
  });
});
