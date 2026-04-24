import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useConfirm, ConfirmProvider } from '@/hooks/useConfirm';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => globalThis.__mockI18n());

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfirmProvider>{children}</ConfirmProvider>
);

describe('useConfirm', () => {

  describe('ConfirmProvider 渲染测试', () => {
    it('应该成功渲染 ConfirmProvider', () => {
      const { container } = render(
        <ConfirmProvider>
          <div>Test Children</div>
        </ConfirmProvider>
      );
      expect(container).toBeTruthy();
    });

    it('应该渲染子组件 当 ConfirmProvider 渲染时', () => {
      render(
        <ConfirmProvider>
          <div data-testid="test-child">Test Children</div>
        </ConfirmProvider>
      );
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Hook 基本功能测试', () => {
    it('应该返回 modal 对象 当使用 useConfirm Hook', () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.modal).toBeDefined();
      expect(result.current.modal.confirm).toBeInstanceOf(Function);
      expect(result.current.modal.warning).toBeInstanceOf(Function);
    });

    it('应该支持调用 confirm 方法 当调用 modal.confirm', () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(() => {
        result.current.modal.confirm({
          title: '测试',
          description: '测试描述',
        });
      }).not.toThrow();
    });

    it('应该支持调用 warning 方法 当调用 modal.warning', () => {
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
    it('应该抛出错误 当在 Context 外使用时', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useConfirm());
      }).toThrow('useConfirm must be used within ConfirmProvider');

      console.error = originalError;
    });
  });

  describe('回调函数功能测试', () => {
    it('应该支持 onOk 回调函数 当传入 onOk 参数', () => {
      const onOk = vi.fn();
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(() => {
        result.current.modal.confirm({
          title: '测试标题',
          description: '测试描述',
          onOk,
        });
      }).not.toThrow();
    });

    it('应该支持 onCancel 回调函数 当传入 onCancel 参数', () => {
      const onCancel = vi.fn();
      const { result } = renderHook(() => useConfirm(), { wrapper });

      expect(() => {
        result.current.modal.confirm({
          title: '测试标题',
          description: '测试描述',
          onCancel,
        });
      }).not.toThrow();
    });

    it('应该在点击确认按钮时调用 onOk 回调', async () => {
      const onOk = vi.fn();
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '确认操作',
        description: '是否继续？',
        onOk,
        okText: '确认操作按钮',
        cancelText: '取消操作按钮',
      });

      // 等待对话框渲染
      await screen.findByText('确认操作');

      // 点击确认按钮
      const confirmButton = screen.getByText('确认操作按钮');
      confirmButton.click();

      expect(onOk).toHaveBeenCalledTimes(1);
    });

    it('应该在点击取消按钮时调用 onCancel 回调', async () => {
      const onCancel = vi.fn();
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '确认操作',
        description: '是否继续？',
        onCancel,
        okText: '确认操作按钮',
        cancelText: '取消操作按钮',
      });

      // 等待对话框渲染
      await screen.findByText('确认操作');

      // 点击取消按钮
      const cancelButton = screen.getByText('取消操作按钮');
      cancelButton.click();

      expect(onCancel).toHaveBeenCalled();
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
