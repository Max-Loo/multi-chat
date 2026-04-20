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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useScrollContainer } from "@/hooks/useScrollContainer";
import { useResetDataDialog } from "@/hooks/useResetDataDialog";
import { exportMasterKey } from "@/store/keyring/masterKey";
import { copyToClipboard } from "@/utils/clipboard";
import { toastQueue } from "@/services/toast";

/**
 * 密钥管理设置页面组件
 */
const KeyManagementSetting: React.FC = () => {
  const { t } = useTranslation();
  const { scrollContainerRef, scrollbarClassname } = useScrollContainer();

  // 导出密钥相关状态：null 对话框关闭，"" 加载中，string 密钥值（展示+复制）
  const [exportState, setExportState] = useState<null | string>(null);

  // 重置数据相关状态
  const { setIsDialogOpen: setIsResetDialogOpen, isResetting, renderResetDialog } = useResetDataDialog();

  const handleExportKey = async () => {
    try {
      setExportState("");
      const key = await exportMasterKey();
      setExportState(key);
    } catch {
      toastQueue.error(t($ => $.setting.keyManagement.exportFailed));
      setExportState(null);
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
      className={`flex flex-col justify-start
        w-full h-full px-4
        overflow-y-auto bg-gray-100
        ${scrollbarClassname}
      `}
    >
      {/* 密钥导出 */}
      <div className="w-full p-3 my-4 bg-white rounded-xl flex flex-row items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium mb-1">
            {t($ => $.setting.keyManagement.exportKey)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t($ => $.setting.keyManagement.exportKeyDescription)}
          </p>
        </div>
        <Button
          onClick={handleExportKey}
          disabled={exportState !== null}
          className="shrink-0 ml-3"
        >
          {t($ => $.setting.keyManagement.exportKey)}
        </Button>
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
          {exportState === "" ? (
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
              {typeof exportState === "string" && exportState !== ""
                ? t($ => $.common.hide)
                : t($ => $.common.cancel)}
            </AlertDialogCancel>
            {exportState === "" ? (
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
      <div className="w-full p-3 my-4 bg-white rounded-xl flex flex-row items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium mb-1">
            {t($ => $.setting.keyManagement.resetAllData)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t($ => $.setting.keyManagement.resetAllDataDescription)}
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setIsResetDialogOpen(true)}
          disabled={isResetting}
          className="shrink-0 ml-3"
        >
          {t($ => $.setting.keyManagement.resetAllData)}
        </Button>
      </div>

      {/* 重置确认对话框 */}
      {renderResetDialog()}
    </div>
  );
};

export default KeyManagementSetting;
