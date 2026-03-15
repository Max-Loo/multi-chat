/**
 * 日志设置组件
 *
 * 提供日志状态显示、导出和清除功能
 */

import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Download,
  Trash2,
  RefreshCw,
  HardDrive,
  Calendar,
  FileText,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { shell, isTauri } from "@/utils/tauriCompat";
import type { LogStatus, LogClearResult } from "@/utils/logger/types";

/**
 * 格式化字节大小为人类可读格式
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 日志设置组件
 */
export function LogSettings() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<LogStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  /**
   * 加载日志状态
   */
  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await invoke<LogStatus>("log_status");
      setStatus(result);
    } catch (error) {
      console.error("Failed to load log status:", error);
      toast.error(t($ => $.setting.log.loadError));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  /**
   * 导出日志
   */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportPath = await invoke<string>("log_export");

      // 在 Tauri 环境中，打开文件所在目录
      if (isTauri()) {
        // 获取目录路径
        const dirPath = exportPath.substring(0, exportPath.lastIndexOf("/"));
        await shell.open(dirPath);
        toast.success(
          t($ => $.setting.log.exportSuccess) + `: ${exportPath}`,
        );
      } else {
        // Web 环境提示
        toast.success(t($ => $.setting.log.exportSuccess));
        console.log("Export path:", exportPath);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("No logs to export")
      ) {
        toast.info(t($ => $.setting.log.noLogs));
      } else {
        console.error("Failed to export logs:", error);
        toast.error(t($ => $.setting.log.exportError));
      }
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * 打开日志目录
   */
  const handleOpenLogDir = async () => {
    if (!isTauri()) {
      toast.info(t($ => $.setting.log.desktopOnly));
      return;
    }

    try {
      // 调用 Rust 命令获取日志目录路径
      const logDir = await invoke<string>("get_log_dir_path");
      await shell.open(logDir);
    } catch (error) {
      console.error("Failed to open log directory:", error);
      toast.error(t($ => $.setting.log.openDirError));
    }
  };

  /**
   * 清除日志
   */
  const handleClear = async () => {
    setIsClearing(true);
    try {
      const result = await invoke<LogClearResult>("log_clear");
      toast.success(
        t($ => $.setting.log.clearSuccess, {
          count: result.deletedFiles,
          size: formatBytes(result.freedBytes),
        }),
      );
      await loadStatus(); // 刷新状态
    } catch (error) {
      console.error("Failed to clear logs:", error);
      toast.error(t($ => $.setting.log.clearError));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-3">
        {t($ => $.setting.log.title)}
      </h3>

      {/* 日志状态 */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t($ => $.setting.log.size)}:
          </span>
          <span className="text-sm font-medium">
            {isLoading ? "..." : formatBytes(status?.totalSizeBytes ?? 0)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t($ => $.setting.log.files)}:
          </span>
          <span className="text-sm font-medium">
            {isLoading ? "..." : status?.fileCount ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-2 col-span-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t($ => $.setting.log.dateRange)}:
          </span>
          <span className="text-sm font-medium">
            {isLoading
              ? "..."
              : status?.oldestDate && status?.newestDate
                ? `${status.oldestDate} ~ ${status.newestDate}`
                : t($ => $.setting.log.noLogs)}
          </span>
        </div>

        <div className="flex items-center gap-2 col-span-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t($ => $.setting.log.retention)}:
          </span>
          <span className="text-sm font-medium">
            {t($ => $.setting.log.retentionDays, {
              days: status?.retentionDays ?? 30,
            })}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={loadStatus} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {t($ => $.common.reload)}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting || !status?.fileCount}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting
            ? t($ => $.setting.log.exporting)
            : t($ => $.setting.log.export)}
        </Button>

        {isTauri() && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenLogDir}
            disabled={!status?.fileCount}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            {t($ => $.setting.log.openDir)}
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isClearing || !status?.fileCount}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t($ => $.setting.log.clear)}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t($ => $.setting.log.clearConfirmTitle)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t($ => $.setting.log.clearConfirmDesc)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t($ => $.common.cancel)}</AlertDialogCancel>
              <AlertDialogAction onClick={handleClear}>
                {t($ => $.common.confirm)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default LogSettings;
