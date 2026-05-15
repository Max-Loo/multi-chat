import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderMetadata } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderMetadata';

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    setting: {
      modelProvider: {
        apiEndpoint: 'API 端点',
        providerId: '供应商 ID',
        viewDocs: '查看文档',
      },
    },
  })
);

describe('ProviderMetadata', () => {
  describe('文档 URL 生成', () => {
    it('deepseek 供应商返回正确的文档链接', () => {
      render(<ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://platform.deepseek.com/api-docs/');
    });

    it('moonshotai 供应商返回正确的文档链接', () => {
      render(<ProviderMetadata apiEndpoint="https://api.moonshot.cn/v1" providerKey="moonshotai" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://platform.moonshot.cn/docs');
    });

    it('zhipu 供应商返回正确的文档链接', () => {
      render(<ProviderMetadata apiEndpoint="https://open.bigmodel.cn/api/paas/v4" providerKey="zhipu" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://open.bigmodel.cn/dev/api');
    });

    it('未知供应商使用 fallback 文档链接', () => {
      render(<ProviderMetadata apiEndpoint="https://api.unknown.com/v1" providerKey="unknown-provider" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://docs.unknown-provider.com');
    });
  });

  describe('元数据信息展示', () => {
    it('显示 API 端点', () => {
      render(<ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />);

      expect(screen.getByText('https://api.deepseek.com/v1')).toBeInTheDocument();
    });

    it('显示供应商 ID', () => {
      render(<ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />);

      expect(screen.getByText('deepseek')).toBeInTheDocument();
    });
  });

  describe('文档链接按钮', () => {
    it('链接在新标签页打开', () => {
      render(<ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('显示文档链接文本', () => {
      render(<ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />);

      expect(screen.getByText('查看文档')).toBeInTheDocument();
    });
  });

  describe('事件冒泡', () => {
    it('点击文档链接时调用 stopPropagation', () => {
      const parentClickHandler = vi.fn();

      render(
        <div onClick={parentClickHandler}>
          <ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />
        </div>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('React.memo 和重新渲染', () => {
    it('props 不变时保持渲染结果', () => {
      const { rerender } = render(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />
      );

      expect(screen.getByText('deepseek')).toBeInTheDocument();

      rerender(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />
      );

      expect(screen.getByText('deepseek')).toBeInTheDocument();
    });

    it('改变 apiEndpoint 时更新显示', () => {
      const { rerender } = render(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />
      );

      expect(screen.getByText('https://api.deepseek.com/v1')).toBeInTheDocument();

      rerender(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v2" providerKey="deepseek" />
      );

      expect(screen.getByText('https://api.deepseek.com/v2')).toBeInTheDocument();
      expect(screen.getByText('deepseek')).toBeInTheDocument();
    });

    it('改变 providerKey 时更新显示和文档链接', () => {
      const { rerender } = render(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />
      );

      expect(screen.getByText('deepseek')).toBeInTheDocument();

      rerender(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="moonshotai" />
      );

      expect(screen.getByText('moonshotai')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://platform.moonshot.cn/docs');
    });

    it('连续多次 rerender 覆盖 memo 比较分支', () => {
      const { rerender } = render(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />
      );

      rerender(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v1" providerKey="deepseek" />
      );

      rerender(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v2" providerKey="deepseek" />
      );

      rerender(
        <ProviderMetadata apiEndpoint="https://api.deepseek.com/v2" providerKey="moonshotai" />
      );

      expect(screen.getByText('moonshotai')).toBeInTheDocument();
    });
  });
});
