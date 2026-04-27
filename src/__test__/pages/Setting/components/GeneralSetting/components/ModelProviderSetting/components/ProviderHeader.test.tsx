/**
 * ProviderHeader 组件单元测试
 *
 * 测试策略：Mock react-i18next 控制 locale 和翻译，验证日期格式化、loading 状态和刷新交互
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 中文 locale mock 资源
const zhResources = {
  setting: {
    modelProvider: {
      title: '模型供应商',
      description: '管理模型供应商和 API 密钥',
      refreshing: '刷新中...',
      refreshButton: '刷新',
      lastUpdateLabel: '最后更新：',
    },
  },
};

// 英文 locale mock 资源
const enResources = {
  setting: {
    modelProvider: {
      title: 'Model Providers',
      description: 'Manage model providers and API keys',
      refreshing: 'Refreshing...',
      refreshButton: 'Refresh',
      lastUpdateLabel: 'Last update: ',
    },
  },
};

const FIXED_DATE = '2025-01-15T08:30:45.000Z';

// Mock react-i18next because 需要控制 i18n.language 来测试不同 locale 的日期格式化
let mockLanguage = 'zh';
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrSelector: any) => {
      const resources = mockLanguage === 'zh' ? zhResources : enResources;
      if (typeof keyOrSelector === 'function') {
        return keyOrSelector(resources);
      }
      return String(keyOrSelector);
    },
    i18n: {
      language: mockLanguage,
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty' as const,
    init: vi.fn(),
  },
}));

// Mock lucide-react 图标
vi.mock('lucide-react', () => ({
  RefreshCw: ({ className }: { className?: string }) => (
    <svg data-testid="refresh-icon" className={className} />
  ),
}));

// Mock Button 组件
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button data-testid="refresh-button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

import { ProviderHeader } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderHeader';

describe('ProviderHeader', () => {
  beforeEach(() => {
    mockLanguage = 'zh';
  });

  describe('中文 locale 日期格式化', () => {
    it('应该包含年月日时分秒 当 i18n.language 为 zh', () => {
      render(<ProviderHeader loading={false} onRefresh={() => {}} lastUpdate={FIXED_DATE} />);

      const updateText = screen.getByText(/最后更新/).textContent;
      expect(updateText).toContain('2025');
      expect(updateText).toContain('01');
      expect(updateText).toContain('15');
      expect(updateText).toContain('30');
      expect(updateText).toContain('45');
    });
  });

  describe('英文 locale 日期格式化', () => {
    it('应该包含年月日时分秒且格式与中文不同 当 i18n.language 为 en', () => {
      // 先渲染中文版本获取格式
      mockLanguage = 'zh';
      const { unmount } = render(<ProviderHeader loading={false} onRefresh={() => {}} lastUpdate={FIXED_DATE} />);
      const zhText = screen.getByText(/最后更新/).textContent;
      unmount();

      // 渲染英文版本
      mockLanguage = 'en';
      render(<ProviderHeader loading={false} onRefresh={() => {}} lastUpdate={FIXED_DATE} />);
      const enText = screen.getByText(/Last update/).textContent;

      expect(enText).toContain('2025');
      expect(enText).toContain('01');
      expect(enText).toContain('15');
      expect(enText).toContain('30');
      expect(enText).toContain('45');
      expect(enText).not.toBe(zhText);
    });
  });

  describe('loading 状态', () => {
    it('应该显示加载文本和 animate-spin 当 loading 为 true', () => {
      render(<ProviderHeader loading={true} onRefresh={() => {}} lastUpdate={null} />);

      expect(screen.getByText('刷新中...')).toBeInTheDocument();
      const icon = screen.getByTestId('refresh-icon');
      expect(icon.className).toContain('animate-spin');
      expect(screen.getByTestId('refresh-button')).toBeDisabled();
    });

    it('应该显示刷新文本和可点击按钮 当 loading 为 false', () => {
      render(<ProviderHeader loading={false} onRefresh={() => {}} lastUpdate={null} />);

      expect(screen.getByText('刷新')).toBeInTheDocument();
      const icon = screen.getByTestId('refresh-icon');
      expect(icon.className).not.toContain('animate-spin');
      expect(screen.getByTestId('refresh-button')).not.toBeDisabled();
    });
  });

  describe('onRefresh 回调和 lastUpdate', () => {
    it('应该调用 onRefresh 当点击刷新按钮', async () => {
      const user = userEvent.setup();
      const onRefresh = vi.fn();

      render(<ProviderHeader loading={false} onRefresh={onRefresh} lastUpdate={null} />);

      await user.click(screen.getByTestId('refresh-button'));
      expect(onRefresh).toHaveBeenCalledOnce();
    });

    it('应该不显示更新时间 当 lastUpdate 为 null', () => {
      render(<ProviderHeader loading={false} onRefresh={() => {}} lastUpdate={null} />);

      expect(screen.queryByText(/最后更新/)).not.toBeInTheDocument();
    });
  });
});
