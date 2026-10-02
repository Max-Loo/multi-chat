/**
 * ModelSelect（表单单选组）组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Model/components/ModelSelect.test.tsx，
 * 保留核心行为语义：
 * - 渲染所有选项
 * - 校验错误时显示红色边框
 * - 选中值变化触发 update:modelValue
 *
 * 注：useFormField 依赖 FORM_ITEM_KEY 注入（VTU 的 global.provide 不支持
 * symbol 键，Object.entries 不枚举 symbol），因此用 wrapper 组件 provide。
 */
import { describe, it, expect } from 'vitest';
import { defineComponent, provide } from 'vue';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
// 桶模块未导出注入键，直接从 useFormField 导入
import {
  FORM_ITEM_KEY,
  type FormItemContextValue,
} from '@/components/ui/form/useFormField';

import ModelSelect from '@/pages/Model/components/ModelSelect.vue';
import type { ModelDetail } from '@/types/model';

/** 创建测试选项 */
const createOption = (modelKey: string, modelName: string): ModelDetail => ({
  modelKey,
  modelName,
});

const OPTIONS: ModelDetail[] = [
  createOption('deepseek-chat', 'DeepSeek Chat'),
  createOption('deepseek-reasoner', 'DeepSeek Reasoner'),
];

/** 构造表单项上下文（控制校验错误状态） */
const createFormItemContext = (errors: unknown[] = []): FormItemContextValue => ({
  id: 'test-form-item',
  fieldState: {
    name: 'model',
    state: { meta: { errors } },
  },
});

/**
 * 渲染包装器：先 provide 表单项上下文再渲染 ModelSelect
 * @param errors 校验错误列表
 * @param modelValue 当前选中值
 */
function renderSelect(errors: unknown[] = [], modelValue?: string) {
  const Wrapper = defineComponent({
    components: { ModelSelect },
    props: {
      modelValue: { type: String, default: undefined },
    },
    emits: ['update:modelValue'],
    setup() {
      provide(FORM_ITEM_KEY, createFormItemContext(errors));
      return { options: OPTIONS };
    },
    template: `
      <ModelSelect
        :options="options"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    `,
  });

  return render(Wrapper, { props: { modelValue } });
}

describe('ModelSelect（Vue 版）', () => {
  it('应该渲染所有选项', () => {
    renderSelect();

    expect(screen.getByTestId('model-option-deepseek-chat')).toHaveTextContent(
      'DeepSeek Chat',
    );
    expect(
      screen.getByTestId('model-option-deepseek-reasoner'),
    ).toHaveTextContent('DeepSeek Reasoner');
  });

  it('应该显示红色边框 当存在校验错误', () => {
    const { container } = renderSelect(['请选择你想要使用的具体模型']);

    const group = container.querySelector('[role="radiogroup"]');
    expect(group?.className).toContain('border-red-500');
  });

  it('应该不显示红色边框 当无校验错误', () => {
    const { container } = renderSelect();

    const group = container.querySelector('[role="radiogroup"]');
    expect(group?.className).not.toContain('border-red-500');
  });

  it('应该调用 update:modelValue 当选中值变化', async () => {
    const { emitted } = renderSelect();
    const user = userEvent.setup();

    await user.click(screen.getByTestId('model-option-deepseek-chat'));

    expect(emitted('update:modelValue')).toEqual([['deepseek-chat']]);
  });
});
