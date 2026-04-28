import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => globalThis.__mockI18n({
  setting: {
    modelProvider: {
      modelCount: '共 {{count}} 个模型',
      clickToViewDetails: '点击查看详情',
    },
  },
}));

import { ProviderCardSummary } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardSummary';

describe('ProviderCardSummary', () => {
  const defaultProps = {
    modelCount: 5,
    isExpanded: false,
  };

  describe('模型数量文本渲染', () => {
    it('应该显示模型数量文本 当传入正常 modelCount', () => {
      render(<ProviderCardSummary {...defaultProps} modelCount={5} />);

      expect(screen.getByText('共 5 个模型')).toBeInTheDocument();
    });

    it('应该显示零数量文本 当 modelCount 为 0', () => {
      render(<ProviderCardSummary {...defaultProps} modelCount={0} />);

      expect(screen.getByText('共 0 个模型')).toBeInTheDocument();
    });
  });

  describe('收起时提示信息', () => {
    it('应该显示点击查看详情 当 isExpanded 为 false', () => {
      render(<ProviderCardSummary {...defaultProps} isExpanded={false} />);

      expect(screen.getByText('点击查看详情')).toBeInTheDocument();
    });
  });

  describe('展开时提示信息', () => {
    it('不应该渲染点击查看详情 当 isExpanded 为 true', () => {
      render(<ProviderCardSummary {...defaultProps} isExpanded={true} />);

      expect(screen.queryByText('点击查看详情')).not.toBeInTheDocument();
    });
  });
});
