import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportAllChats, exportDeletedChats } from "@/services/chatExport";
import { toastQueue } from "@/services/toast";

/**
 * 下载 JSON 文件（浏览器通用方案）
 */
function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 聊天导出设置组件
 */
const ChatExportSetting: React.FC = () => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  /**
   * 导出所有活跃聊天
   */
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllChats();
      downloadJson(data, `chats-export-${Date.now()}.json`);
      toastQueue.success(t($ => $.setting.chatExport.exportSuccess));
    } catch (error) {
      console.error('导出聊天失败:', error);
      toastQueue.error(t($ => $.setting.chatExport.exportFailed));
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * 导出已删除聊天
   */
  const handleExportDeleted = async () => {
    setIsExporting(true);
    try {
      const data = await exportDeletedChats();
      if (data.chats.length === 0) {
        toastQueue.info(t($ => $.setting.chatExport.noDeletedChats));
        return;
      }
      downloadJson(data, `deleted-chats-export-${Date.now()}.json`);
      toastQueue.success(t($ => $.setting.chatExport.exportSuccess));
    } catch (error) {
      console.error('导出已删除聊天失败:', error);
      toastQueue.error(t($ => $.setting.chatExport.exportFailed));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-1">
          <div className="text-base">{t($ => $.setting.chatExport.title)}</div>
          <div className="text-sm text-gray-500">
            {t($ => $.setting.chatExport.description)}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportAll}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {t($ => $.setting.chatExport.exportAll)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportDeleted}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {t($ => $.setting.chatExport.exportDeleted)}
        </Button>
      </div>
    </div>
  );
};

export default ChatExportSetting;
