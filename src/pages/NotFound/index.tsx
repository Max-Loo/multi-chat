import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * 404 页面组件
 * 用于显示页面未找到的错误信息
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center justify-center space-y-6 p-8">
        {/* 404 图标 */}
        <div className="relative">
          <AlertCircle className="h-32 w-32 text-muted-foreground/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-muted-foreground">404</span>
          </div>
        </div>

        {/* 错误信息 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t($ => $.common.pageNotFound)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t($ => $.common.pageNotFoundDescription)}
          </p>
        </div>

        {/* 返回按钮 */}
        <Button onClick={() => navigate(-1)} variant="default" size="default">
          {t($ => $.common.goBack)}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;