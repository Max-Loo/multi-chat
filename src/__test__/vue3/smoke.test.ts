/**
 * Vue3 基础设施冒烟测试
 *
 * 验证 SFC 编译（@vitejs/plugin-vue）与 @testing-library/vue 挂载链路可用，
 * 是阶段二 Vue3 迁移的基础设施验收测试。
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import SmokeComponent from './SmokeComponent.vue';

describe('Vue3 基础设施冒烟', () => {
  it('SFC 组件可挂载并响应交互', async () => {
    render(SmokeComponent);

    // SFC 模板渲染正常
    expect(screen.getByRole('status')).toHaveTextContent('Vue3 冒烟验证');

    // 组合式 API 响应性正常
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('点击次数：0');
    await fireEvent.click(button);
    expect(button).toHaveTextContent('点击次数：1');
  });
});
