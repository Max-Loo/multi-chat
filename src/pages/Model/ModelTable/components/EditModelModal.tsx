import { Dialog, DialogContent } from "@/components/ui/dialog"
import ModelConfigForm from "../../components/ModelConfigForm"
import { ModelProviderKeyEnum } from "@/utils/enums"
import { useMemo } from "react"
import { EditableModel, Model } from "@/types/model"
import { useAppDispatch } from "@/hooks/redux"
import { editModel } from "@/store/slices/modelSlice"
import { useTranslation } from "react-i18next"
import { toast } from 'sonner'

interface EditModelModalProps {
  // 是否打开弹窗
  isModalOpen?: boolean
  // 点击关闭弹窗或者点击蒙层关闭的回调
  onModalCancel?: () => void
  modelProviderKey?: ModelProviderKeyEnum;
  modelParams?: EditableModel;
}

/**
 * 编辑模型详情的弹窗
 */
const EditModelModal: React.FC<EditModelModalProps> = ({
  isModalOpen,
  onModalCancel = () => {},
  modelProviderKey,
  modelParams,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const isOpen = useMemo(() => {
    return Boolean(isModalOpen ?? modelProviderKey)
  }, [isModalOpen, modelProviderKey])

  // 完成编辑校验成功后的回调
  // @param model 完整的模型数据
  const onEditFinish = (model: Model): void => {
    try {
      dispatch(editModel({
        model,
      }))
      toast.success(t($ => $.model.editModelSuccess))
    } catch {
      toast.error(t($ => $.model.editModelFailed))
    }

    // 让父组件关闭弹窗
    onModalCancel()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onModalCancel()}>
      <DialogContent className="max-w-[80%] top-[6%] translate-y-[calc(-6%+0px)]">
        <div className="pt-6">
          {modelProviderKey && <ModelConfigForm
            modelProviderKey={modelProviderKey}
            modelParams={modelParams}
            onFinish={onEditFinish}
          />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditModelModal
