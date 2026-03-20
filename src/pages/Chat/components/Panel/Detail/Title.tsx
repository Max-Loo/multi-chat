import { useAppSelector } from "@/hooks/redux";
import { ChatModel } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProviderLogo } from "@/components/ProviderLogo";
import { isNil } from "es-toolkit";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface DetailTitleProps {
  chatModel: ChatModel;
}

const Title = memo<DetailTitleProps>(({ chatModel }) => {
  const { t } = useTranslation();
  // 模型列表
  const models = useAppSelector((state) => state.models.models);

  // 当前展示的模型在模型列表里面的完整版
  const currentModel = useMemo(() => {
    return models.find((model) => model.id === chatModel.modelId);
  }, [chatModel, models]);

  // 模型不存在时显示错误提示
  if (isNil(currentModel)) {
    return (
      <Badge variant="destructive">{t(($) => $.chat.modelDeleted)}</Badge>
    );
  }

  // 显示名称：昵称非空时显示「昵称 (模型名)」，否则仅显示模型名
  const displayName = currentModel.nickname
    ? `${currentModel.nickname} (${currentModel.modelName})`
    : currentModel.modelName;

  // 状态 Badge（仅异常状态显示）
  let statusTag: React.ReactNode = null;

  if (currentModel.isDeleted) {
    statusTag = (
      <Badge variant="destructive" className="text-white">
        {t(($) => $.chat.deleted)}
      </Badge>
    );
  } else if (!currentModel.isEnable) {
    statusTag = (
      <Badge variant="secondary" className="bg-orange-500 text-white">
        {t(($) => $.chat.disabled)}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-0 cursor-default">
            <ProviderLogo
              providerKey={currentModel.providerKey}
              providerName={currentModel.providerName}
              size={24}
            />
            <span className="truncate">{displayName}</span>
            {statusTag}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <div>
              {t(($) => $.chat.supplier)}: {currentModel.providerName}
            </div>
            <div>
              {t(($) => $.chat.model)}: {currentModel.modelName}
            </div>
            <div>
              {t(($) => $.chat.nickname)}: {currentModel.nickname || "-"}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default Title;
