import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => globalThis.__mockI18n({
  setting: {
    modelProvider: {
      status: { available: '可用', unavailable: '不可用' },
    },
  },
}));

vi.mock('lucide-react', () => ({
  CheckCircle: (props: any) => <svg data-testid="check-circle-icon" {...props} />,
  XCircle: (props: any) => <svg data-testid="x-circle-icon" {...props} />,
  ChevronDown: (props: any) => <svg data-testid="chevron-down-icon" {...props} />,
  ChevronUp: (props: any) => <svg data-testid="chevron-up-icon" {...props} />,
}));

vi.mock('@/components/ProviderLogo', () => ({
  ProviderLogo: ({ providerKey, providerName, size }: any) => (
    <div data-testid="provider-logo" data-key={providerKey} data-name={providerName} data-size={size} />
  ),
}));

import { ProviderCardHeader } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardHeader';

describe('ProviderCardHeader', () => {
  const defaultProps = {
    providerName: 'DeepSeek',
    providerKey: 'deepseek',
    status: 'available' as const,
    isExpanded: false,
  };

  describe('供应商名称和 Logo 渲染', () => {
    it('应该渲染供应商名称和 Logo 当传入 providerName 和 providerKey', () => {
      render(<ProviderCardHeader {...defaultProps} />);

      expect(screen.getByText('DeepSeek')).toBeInTheDocument();

      const logo = screen.getByTestId('provider-logo');
      expect(logo).toBeInTheDocument();
      expect(logo.dataset.key).toBe('deepseek');
      expect(logo.dataset.name).toBe('DeepSeek');
      expect(logo.dataset.size).toBe('40');
    });
  });

  describe('available 状态徽章', () => {
    it('应该显示 CheckCircle 图标和可用文本 当 status 为 available', () => {
      render(<ProviderCardHeader {...defaultProps} status="available" />);

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('可用')).toBeInTheDocument();
      expect(screen.queryByTestId('x-circle-icon')).not.toBeInTheDocument();
    });
  });

  describe('unavailable 状态徽章', () => {
    it('应该显示 XCircle 图标和不可用文本 当 status 为 unavailable', () => {
      render(<ProviderCardHeader {...defaultProps} status="unavailable" />);

      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('不可用')).toBeInTheDocument();
      expect(screen.queryByTestId('check-circle-icon')).not.toBeInTheDocument();
    });
  });

  describe('展开/折叠图标方向', () => {
    it('应该渲染 ChevronDown 当 isExpanded 为 false', () => {
      render(<ProviderCardHeader {...defaultProps} isExpanded={false} />);

      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-up-icon')).not.toBeInTheDocument();
    });

    it('应该渲染 ChevronUp 当 isExpanded 为 true', () => {
      render(<ProviderCardHeader {...defaultProps} isExpanded={true} />);

      expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    });
  });
});
