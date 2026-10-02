/**
 * ProviderCardSummary / ProviderMetadata 组件测试（Vue 版）
 *
 * 迁移自旧版 Setting/.../ProviderCardSummary.test.tsx 与 ProviderMetadata.test.tsx，
 * 保留核心语义：
 * - Summary：模型数量文本、收起时显示查看提示、展开时不显示
 * - Metadata：API 端点、供应商 ID、文档链接（新标签页打开）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import ProviderCardSummary from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardSummary.vue';
import ProviderMetadata from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderMetadata.vue';

describe('ProviderCardSummary（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示模型数量文本 当传入正常 modelCount', () => {
    render(ProviderCardSummary, { props: { modelCount: 5, isExpanded: false } });

    expect(screen.getByText('共 5 个模型')).toBeInTheDocument();
  });

  it('应该显示零数量文本 当 modelCount 为 0', () => {
    render(ProviderCardSummary, { props: { modelCount: 0, isExpanded: false } });

    expect(screen.getByText('共 0 个模型')).toBeInTheDocument();
  });

  it('应该显示点击查看详情 当 isExpanded 为 false', () => {
    render(ProviderCardSummary, { props: { modelCount: 5, isExpanded: false } });

    expect(screen.getByText('点击查看详情')).toBeInTheDocument();
  });

  it('不应该渲染点击查看详情 当 isExpanded 为 true', () => {
    render(ProviderCardSummary, { props: { modelCount: 5, isExpanded: true } });

    expect(screen.queryByText('点击查看详情')).not.toBeInTheDocument();
  });
});

describe('ProviderMetadata（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('显示 API 端点', () => {
    render(ProviderMetadata, {
      props: { apiEndpoint: 'https://api.deepseek.com/v1', providerKey: 'deepseek' },
    });

    expect(screen.getByText('https://api.deepseek.com/v1')).toBeInTheDocument();
  });

  it('显示供应商 ID', () => {
    render(ProviderMetadata, {
      props: { apiEndpoint: 'https://api.deepseek.com/v1', providerKey: 'deepseek' },
    });

    expect(screen.getByText('deepseek')).toBeInTheDocument();
  });

  it('deepseek 供应商返回正确的文档链接', () => {
    render(ProviderMetadata, {
      props: { apiEndpoint: 'https://api.deepseek.com/v1', providerKey: 'deepseek' },
    });

    const link = screen.getByText('查看文档').closest('a');
    expect(link).toHaveAttribute(
      'href',
      'https://platform.deepseek.com/api-docs/',
    );
  });

  it('moonshotai 供应商返回正确的文档链接', () => {
    render(ProviderMetadata, {
      props: { apiEndpoint: 'https://api.moonshot.cn/v1', providerKey: 'moonshotai' },
    });

    expect(screen.getByText('查看文档').closest('a')).toHaveAttribute(
      'href',
      'https://platform.moonshot.cn/docs',
    );
  });

  it('未知供应商使用 fallback 文档链接', () => {
    render(ProviderMetadata, {
      props: { apiEndpoint: 'https://api.example.com', providerKey: 'unknown-key' },
    });

    expect(screen.getByText('查看文档').closest('a')).toHaveAttribute(
      'href',
      'https://docs.unknown-key.com',
    );
  });

  it('链接在新标签页打开', () => {
    render(ProviderMetadata, {
      props: { apiEndpoint: 'https://api.deepseek.com/v1', providerKey: 'deepseek' },
    });

    expect(screen.getByText('查看文档').closest('a')).toHaveAttribute(
      'target',
      '_blank',
    );
  });
});
