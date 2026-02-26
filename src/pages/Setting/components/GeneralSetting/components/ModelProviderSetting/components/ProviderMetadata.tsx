import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ProviderMetadata 组件的属性
 */
interface ProviderMetadataProps {
  /** API 端点 */
  apiEndpoint: string;
  /** 供应商唯一标识符 */
  providerKey: string;
}

/**
 * 供应商元数据组件
 * 显示 API 端点和文档链接
 */
export const ProviderMetadata = React.memo<ProviderMetadataProps>(
  ({ apiEndpoint, providerKey }) => {
    // 构建文档链接（根据不同供应商）
    const getDocUrl = () => {
      const docUrls: Record<string, string> = {
        deepseek: 'https://platform.deepseek.com/api-docs/',
        moonshotai: 'https://platform.moonshot.cn/docs',
        zhipu: 'https://open.bigmodel.cn/dev/api',
      };
      return docUrls[providerKey] || `https://docs.${providerKey}.com`;
    };

    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">API 端点:</span>
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {apiEndpoint}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">供应商 ID:</span>
          <span className="font-mono text-xs">{providerKey}</span>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            asChild
          >
            <a
              href={getDocUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              查看文档
            </a>
          </Button>
        </div>
      </div>
    );
  }
);

ProviderMetadata.displayName = 'ProviderMetadata';
