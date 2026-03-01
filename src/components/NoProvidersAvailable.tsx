import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * 处理重新加载页面
 */
const handleReload = () => {
  window.location.reload();
};

/**
 * 无可用模型供应商提示组件
 * 当应用无法获取任何模型供应商数据时显示
 */
export const NoProvidersAvailable: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center gap-6 text-center p-6">
        <AlertCircle className="h-16 w-16 text-destructive" />

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{t($ => $.common.noProvidersAvailable)}</h2>
          <p className="text-muted-foreground">
            {t($ => $.common.noProvidersDescription)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t($ => $.common.noProvidersHint)}
          </p>
        </div>

        <Button onClick={handleReload} size="lg">
          {t($ => $.common.reload)}
        </Button>
      </div>
    </div>
  );
};
