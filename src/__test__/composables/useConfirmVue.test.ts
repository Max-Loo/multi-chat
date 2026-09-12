/**
 * Vue useConfirm 组合式函数测试
 *
 * 行为基线与迁移前 React 版 useConfirm + ConfirmProvider 一致：
 * - modal.confirm / modal.warning API
 * - onOk / onCancel 回调触发与对话框关闭
 * - 默认标题/按钮文案走 i18n，warning 默认标题为「警告」
 * - ConfirmDialog.vue 渲染状态驱动的确认对话框
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { nextTick } from 'vue';

vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    common: { confirm: '确认', cancel: '取消' },
  }));

import { useConfirm } from '@/composables/useConfirm';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

describe('useConfirm（Vue 版）', () => {
  beforeEach(() => {
    // 模块级单例状态：测试间重置关闭状态
    const { state } = useConfirm();
    state.isOpen = false;
  });

  it('返回 modal API（confirm / warning）与状态', async () => {
    const { modal, state } = useConfirm();

    expect(modal).toBeDefined();
    expect(typeof modal.confirm).toBe('function');
    expect(typeof modal.warning).toBe('function');
    expect(state.isOpen).toBe(false);
  });

  it('modal.confirm 打开对话框并渲染标题与描述', async () => {
    const { modal } = useConfirm();
    render(ConfirmDialog);

    modal.confirm({ title: '确认删除？', description: '此操作无法撤销' });
    await nextTick();

    expect(screen.getByText('确认删除？')).toBeVisible();
    expect(screen.getByText('此操作无法撤销')).toBeVisible();
  });

  it('content 参数作为描述展示', async () => {
    const { modal } = useConfirm();
    render(ConfirmDialog);

    modal.confirm({ title: '确认', content: '测试内容' });
    await nextTick();

    expect(screen.getByText('测试内容')).toBeVisible();
  });

  it('modal.warning 默认标题为「警告」', async () => {
    const { modal } = useConfirm();
    render(ConfirmDialog);

    modal.warning({ description: '警告内容' });
    await nextTick();

    expect(screen.getByText('警告')).toBeVisible();
    expect(screen.getByText('警告内容')).toBeVisible();
  });

  it('confirm 未传标题时默认使用 i18n 确认文案', async () => {
    const { modal } = useConfirm();
    render(ConfirmDialog);

    modal.confirm({ description: '内容' });
    await nextTick();

    expect(screen.getByRole('heading', { name: '确认' })).toBeVisible();
  });

  it('点击确认按钮触发 onOk 并关闭对话框', async () => {
    const onOk = vi.fn();
    const { modal, state } = useConfirm();
    render(ConfirmDialog);

    modal.confirm({ title: '确认操作', okText: '确认按钮', cancelText: '取消按钮', onOk });
    await nextTick();

    await fireEvent.click(screen.getByRole('button', { name: '确认按钮' }));

    expect(onOk).toHaveBeenCalledTimes(1);
    expect(state.isOpen).toBe(false);
  });

  it('点击取消按钮触发 onCancel 并关闭对话框', async () => {
    const onCancel = vi.fn();
    const { modal, state } = useConfirm();
    render(ConfirmDialog);

    modal.confirm({ title: '确认操作', okText: '确认按钮', cancelText: '取消按钮', onCancel });
    await nextTick();

    await fireEvent.click(screen.getByRole('button', { name: '取消按钮' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(state.isOpen).toBe(false);
  });

  it('未传回调时点击按钮不抛错', async () => {
    const { modal } = useConfirm();
    render(ConfirmDialog);

    modal.confirm({ title: '无回调', okText: '确认按钮', cancelText: '取消按钮' });
    await nextTick();

    await expect(fireEvent.click(screen.getByRole('button', { name: '确认按钮' }))).resolves.not.toThrow();
  });

  it('支持自定义按钮文本', async () => {
    const { modal } = useConfirm();
    render(ConfirmDialog);

    modal.confirm({ title: '测试', okText: '好的', cancelText: '不了' });
    await nextTick();

    expect(screen.getByRole('button', { name: '好的' })).toBeVisible();
    expect(screen.getByRole('button', { name: '不了' })).toBeVisible();
  });

  it('关闭后再次调用展示新内容', async () => {
    const { modal } = useConfirm();
    render(ConfirmDialog);

    modal.confirm({ title: '第一次' });
    await nextTick();
    expect(screen.getByText('第一次')).toBeVisible();

    // 点击默认确认按钮关闭后，再次打开展示新内容
    await fireEvent.click(screen.getByRole('button', { name: '确认' }));
    await nextTick();

    useConfirm().modal.confirm({ title: '第二次' });
    await nextTick();

    expect(screen.getByText('第二次')).toBeVisible();
  });

  it('无描述时不渲染描述节点', async () => {
    const { modal } = useConfirm();
    const { container } = render(ConfirmDialog);

    modal.confirm({ title: '无描述' });
    await nextTick();

    expect(screen.getByText('无描述')).toBeVisible();
    expect(container.textContent).not.toContain('此操作');
  });
});
