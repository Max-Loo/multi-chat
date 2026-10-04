/**
 * useConfirm 组合式函数测试
 *
 * 验证确认/取消回调、默认文案回退与 warning 变体
 */

import { describe, it, expect, vi } from 'vitest';
import {
  useConfirm,
  confirmState,
  confirmOk,
  confirmCancel,
  showConfirm,
} from '@/composables/useConfirm';

describe('useConfirm', () => {
  it('showConfirm 应该打开对话框并记录回调', () => {
    const onOk = vi.fn();
    const onCancel = vi.fn();

    showConfirm({
      title: '确认删除？',
      description: '此操作无法撤销',
      onOk,
      onCancel,
      okText: '删除',
      cancelText: '再想想',
    });

    expect(confirmState.isOpen).toBe(true);
    expect(confirmState.title).toBe('确认删除？');
    expect(confirmState.description).toBe('此操作无法撤销');
    expect(confirmState.confirmText).toBe('删除');
    expect(confirmState.cancelText).toBe('再想想');

    confirmOk();
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(confirmState.isOpen).toBe(false);
  });

  it('确认后对话框应该关闭', () => {
    showConfirm({ title: 't' });
    confirmOk();

    expect(confirmState.isOpen).toBe(false);
  });

  it('取消时应该触发 onCancel 回调', () => {
    const onCancel = vi.fn();

    showConfirm({ title: 't', onCancel });
    confirmCancel();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(confirmState.isOpen).toBe(false);
  });

  it('未提供文案时应该回退到国际化默认键', () => {
    showConfirm({});

    // tSafely 缺失资源时回退为兜底文案
    expect(confirmState.confirmText).toBe('确认');
    expect(confirmState.cancelText).toBe('取消');
  });

  it('modal.warning 应该在无标题时使用警告默认标题', () => {
    const { modal } = useConfirm();

    modal.warning({ description: '注意' });

    expect(confirmState.title).toBe('警告');
    expect(confirmState.description).toBe('注意');
    confirmCancel();
  });

  it('modal.confirm 应该等价于 showConfirm', () => {
    const { modal } = useConfirm();
    const onOk = vi.fn();

    modal.confirm({ title: '通过 modal', onOk });
    confirmOk();

    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('content 字段应该作为 description 的兼容来源', () => {
    showConfirm({ content: '正文内容' });

    expect(confirmState.description).toBe('正文内容');
    confirmCancel();
  });
});
