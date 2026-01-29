import { useAppSelector } from "@/hooks/redux";
import { ChatModel } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { isNil } from "es-toolkit";
import { JSX, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface DetailTitleProps {
  chatModel: ChatModel
}

const DetailTitle = memo<DetailTitleProps>(({
  chatModel,
}) => {
  const { t } = useTranslation()
  // 模型列表
  const models = useAppSelector(state => state.models.models)

  // 当前展示的模型在模型列表里面的完整版
  const currentModel = useMemo(() => {
    return models.find(model => model.id === chatModel.modelId)
  }, [chatModel, models])

  if (isNil(currentModel)) {
    return <Badge variant="destructive">{t($ => $.chat.modelDeleted)}</Badge>
  }

  let statusTag: JSX.Element | null = null

  if (currentModel.isDeleted) {
    statusTag = <Badge variant="destructive" className="text-white">{t($ => $.chat.deleted)}</Badge>
  }

  if (!currentModel.isEnable) {
    statusTag = <Badge variant="secondary" className="bg-orange-500 text-white">{t($ => $.chat.disabled)}</Badge>
  }

  return <div className="flex items-center">
    {`${currentModel.providerName} | ${currentModel.modelName} | ${currentModel.nickname}`}
    <div className="ml-2">{statusTag}</div>
  </div>
})


export default DetailTitle