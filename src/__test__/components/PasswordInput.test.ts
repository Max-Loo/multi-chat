/**
 * PasswordInput 组件回归测试（Vue 版）
 *
 * 编码的业务约束：创建模型表单的 API Key 字段依赖本组件的 v-model 同步——
 * 若输入不触发 update:modelValue，TanStack Form 永远拿不到 apiKey，
 * 表单校验必然失败，用户无法创建模型（浏览器 e2e 曾发现此回归，
 * 表现为提交静默失败、无任何错误提示）。
 *
 * 同时保留既有交互行为：明文/密文切换与对应的可访问名称。
 */
import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

import PasswordInput from '@/components/ui/password-input/PasswordInput.vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

describe('PasswordInput', () => {
  it('用户输入时同步 emit update:modelValue（表单 apiKey 依赖此同步，否则模型无法创建）', async () => {
    const { emitted } = render(PasswordInput, {
      props: { modelValue: '' },
    });

    const input = screen.getByDisplayValue('');
    await userEvent.type(input, 'sk-test-123');

    const updates = emitted<'update:modelValue'>('update:modelValue');
    expect(updates).toBeTruthy();
    // 逐字符输入的最后一次 emit 必须携带完整值
    const lastValue = updates!.at(-1)?.[0];
    expect(lastValue).toBe('sk-test-123');
  });

  it('受控值通过 modelValue 回显到输入框', () => {
    render(PasswordInput, {
      props: { modelValue: 'sk-existing-key' },
    });

    expect(
      screen.getByDisplayValue('sk-existing-key'),
    ).toBeInTheDocument();
  });

  it('默认密文显示，点击切换后明文显示且可访问名称同步更新', async () => {
    render(PasswordInput, {
      props: { modelValue: 'secret' },
    });

    const input = screen.getByDisplayValue('secret');
    expect(input).toHaveAttribute('type', 'password');

    // zh 字典：common.show = 显示 / common.hide = 隐藏
    const toggle = screen.getByRole('button', { name: '显示' });
    await userEvent.click(toggle);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: '隐藏' })).toBeInTheDocument();
  });

  it('disabled 时输入框与切换按钮均不可交互', () => {
    render(PasswordInput, {
      props: { modelValue: '', disabled: true },
    });

    expect(screen.getByDisplayValue('')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: '显示' }),
    ).toBeDisabled();
  });

  it('ref 工厂响应式值驱动受控回显（对齐 Form 字段 state 用法）', async () => {
    const model = ref('initial');
    render(defineHost(model));

    const input = screen.getByDisplayValue('initial');
    await userEvent.type(input, 'X');
    // 输入经 emit → 父组件 ref 更新 → 回显
    expect(model.value).toBe('initialX');
  });
});

/**
 * 构造 v-model 宿主组件：模拟 Form 字段的 :model-value + @update:model-value 接法
 */
function defineHost(model: Ref<string>) {
  return defineComponent({
    setup() {
      return () =>
        h(PasswordInput, {
          modelValue: model.value,
          'onUpdate:modelValue': (v: string) => {
            model.value = v;
          },
        });
    },
  });
}
