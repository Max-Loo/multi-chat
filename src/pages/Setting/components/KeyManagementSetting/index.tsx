/**
 * 密钥管理设置页面
 * 提供密钥导出和全量数据重置功能
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar";
import { useResetDataDialog } from "@/hooks/useResetDataDialog";
import { useRef, useEffect } from "react";
import { exportMasterKey } from "@/store/keyring/masterKey";
import { copyToClipboard } from "@/utils/clipboard";
import { toastQueue } from "@/services/toast";

/**
 * 密钥管理设置页面组件
 */
const KeyManagementSetting: React.FC = () => {
  const { t } = useTranslation();
  const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 导出密钥相关状态：null 对话框关闭，string 密钥值（展示+复制）
  const [exportState, setExportState] = useState<null | string>(null);
  const [isFetchingKey, setIsFetchingKey] = useState(false);

  // 重置数据相关状态
  const { isDialogOpen: isResetDialogOpen, setIsDialogOpen: setIsResetDialogOpen, isResetting, handleConfirmReset } = useResetDataDialog();

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", onScrollEvent, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScrollEvent);
    };
  }, [onScrollEvent]);

  const handleExportKey = async () => {
    try {
      setExportState("");
      setIsFetchingKey(true);
      const key = await exportMasterKey();
      setExportState(key);
    } catch {
      toastQueue.error(t($ => $.setting.keyManagement.exportFailed));
      setExportState(null);
    } finally {
      setIsFetchingKey(false);
    }
  };

  /** 复制已缓存的密钥到剪贴板，成功则关闭对话框，失败则保持打开以便手动复制 */
  const handleCopyKey = async () => {
    if (typeof exportState !== "string") return;
    try {
      await copyToClipboard(exportState);
      toastQueue.success(t($ => $.setting.keyManagement.exportSuccess));
      setExportState(null);
    } catch {
      toastQueue.error(t($ => $.setting.keyManagement.exportFailed));
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className={`flex flex-col items-center justify-start
        w-full h-full px-4
        overflow-y-auto bg-gray-100
        ${scrollbarClassname}
      `}
    >
      {/* 密钥导出 */}
      <div className="w-full p-3 my-4 bg-white rounded-xl flex flex-col justify-start items-center">
        <div className="w-full">
          <h3 className="text-base font-medium mb-1">
            {t($ => $.setting.keyManagement.exportKey)}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {t($ => $.setting.keyManagement.exportKeyDescription)}
          </p>
          <Button
            onClick={handleExportKey}
            disabled={exportState !== null}
            className="w-full sm:w-auto"
          >
            {t($ => $.setting.keyManagement.exportKey)}
          </Button>
        </div>
      </div>

      {/* 导出密钥对话框 */}
      <AlertDialog open={exportState !== null} onOpenChange={(open) => { if (!open) setExportState(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t($ => $.setting.keyManagement.exportKey)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t($ => $.setting.keyManagement.exportKeyDialogDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isFetchingKey ? (
            <Input
              readOnly
              disabled
              value="..."
              className="font-mono text-sm"
            />
          ) : typeof exportState === "string" ? (
            <Input
              readOnly
              value={exportState}
              className="font-mono text-sm"
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>
              {typeof exportState === "string" && !isFetchingKey
                ? t($ => $.common.hide)
                : t($ => $.common.cancel)}
            </AlertDialogCancel>
            {isFetchingKey ? (
              <Button disabled>...</Button>
            ) : typeof exportState === "string" ? (
              <Button onClick={handleCopyKey}>
                {t($ => $.setting.keyManagement.copyToClipboard)}
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置所有数据 */}
      <div className="w-full p-3 my-4 bg-white rounded-xl flex flex-col justify-start items-center">
        <div className="w-full">
          <h3 className="text-base font-medium mb-1">
            {t($ => $.setting.keyManagement.resetAllData)}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {t($ => $.setting.keyManagement.resetAllDataDescription)}
          </p>
          <Button
            variant="destructive"
            onClick={() => setIsResetDialogOpen(true)}
            disabled={isResetting}
            className="w-full sm:w-auto"
          >
            {t($ => $.setting.keyManagement.resetAllData)}
          </Button>
        </div>
      </div>

      {/* 重置确认对话框 */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t($ => $.common.resetConfirmTitle)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t($ => $.common.resetConfirmDescription)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>
              {t($ => $.common.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t($ => $.common.resetConfirmAction)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KeyManagementSetting;
