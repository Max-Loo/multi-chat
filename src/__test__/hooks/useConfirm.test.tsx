import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useConfirm, ConfirmProvider } from '@/hooks/useConfirm';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

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

      // 验证对话框已关闭（isOpen 被设为 false）
      await waitFor(() => {
        expect(screen.queryByText('确认操作')).not.toBeInTheDocument();
      });
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

      // 验证对话框已关闭（isOpen 被设为 false）
      await waitFor(() => {
        expect(screen.queryByText('确认操作')).not.toBeInTheDocument();
      });
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

  describe('confirm 与 warning 分支独立验证', () => {
    it('warning 应使用默认标题 当未传入 title', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.warning({ description: '警告内容' });

      // warning 分支：title 默认为 '警告'
      expect(await screen.findByText('警告')).toBeInTheDocument();
      expect(screen.getByText('警告内容')).toBeInTheDocument();
    });

    it('warning 应使用自定义标题 当传入 title', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.warning({ title: '自定义警告', description: '警告内容' });

      expect(await screen.findByText('自定义警告')).toBeInTheDocument();
    });

    it('confirm 应使用默认标题 当未传入 title', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({ description: '确认内容' });

      expect(await screen.findByText('确认内容')).toBeInTheDocument();
      // title 默认使用 t('common.confirm')，出现在标题位置
      expect(screen.getByRole('heading', { name: '确认' })).toBeInTheDocument();
    });

    it('confirm 应使用默认按钮文本 当未传入 okText/cancelText', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({ description: '按钮文本测试' });

      await screen.findByText('按钮文本测试');

      // confirmText 默认为 t('common.confirm') → '确认'
      // cancelText 默认为 t('common.cancel') → '取消'
      const buttons = screen.getAllByRole('button');
      const buttonTexts = buttons.map(b => b.textContent);
      expect(buttonTexts).toContain('确认');
      expect(buttonTexts).toContain('取消');
    });
  });

  describe('回调触发与跳过路径测试', () => {
    it('应正常工作 当不传入 onOk 回调', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '无回调确认',
        description: '描述',
        okText: '确认按钮',
      });

      await screen.findByText('无回调确认');

      // 点击确认按钮不抛错（onOk?.() 可选链）
      expect(() => {
        screen.getByText('确认按钮').click();
      }).not.toThrow();
    });

    it('应正常工作 当不传入 onCancel 回调', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '无取消回调',
        description: '描述',
        cancelText: '取消按钮',
      });

      await screen.findByText('无取消回调');

      // 点击取消按钮不抛错（onCancel?.() 可选链）
      expect(() => {
        screen.getByText('取消按钮').click();
      }).not.toThrow();
    });
  });

  describe('对话框关闭后状态重置测试', () => {
    it('应在点击确认后关闭对话框', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '测试关闭',
        description: '描述',
        okText: '确认关闭',
      });

      await screen.findByText('测试关闭');

      screen.getByText('确认关闭').click();

      // 对话框关闭后，标题应不再显示
      await waitFor(() => {
        expect(screen.queryByText('测试关闭')).not.toBeInTheDocument();
      });
    });

    it('应在点击取消后关闭对话框', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '测试取消关闭',
        description: '描述',
        cancelText: '取消关闭',
      });

      await screen.findByText('测试取消关闭');

      screen.getByText('取消关闭').click();

      await waitFor(() => {
        expect(screen.queryByText('测试取消关闭')).not.toBeInTheDocument();
      });
    });
  });

  describe('onOpenChange 条件分支测试', () => {
    it('应触发 onCancel 当通过 Escape 关闭对话框', async () => {
      const onCancel = vi.fn();
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: 'Escape关闭',
        description: '描述',
        onCancel,
      });

      await screen.findByText('Escape关闭');

      // 按 Escape 键关闭对话框（触发 onOpenChange(false)）
      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

      // onCancel 应通过 onOpenChange(!open && state.onCancel()) 被调用
      await waitFor(() => {
        expect(onCancel).toHaveBeenCalled();
      });
    });

    it('应在 onOpenChange(false) 时关闭对话框', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '遮罩关闭测试',
        description: '描述',
      });

      await screen.findByText('遮罩关闭测试');

      // 按 Escape 关闭
      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('遮罩关闭测试')).not.toBeInTheDocument();
      });
    });
  });

  describe('description 条件渲染测试', () => {
    it('应不渲染描述组件 当 description 为空', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({ title: '无描述' });

      await screen.findByText('无描述');

      // AlertDialogDescription 不应存在（state.description && 条件渲染）
      const descriptions = screen.queryAllByRole('paragraph');
      // 只有 title 存在，description 不应渲染
      expect(descriptions).toHaveLength(0);
    });

    it('应渲染描述组件 当 description 非空', async () => {
      const { result } = renderHook(() => useConfirm(), { wrapper });

      result.current.modal.confirm({
        title: '有描述',
        description: '这是描述内容',
      });

      expect(await screen.findByText('这是描述内容')).toBeInTheDocument();
    });
  });
});
