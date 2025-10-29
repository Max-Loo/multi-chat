import { message, Modal } from "antd"
import ModelConfigForm from "../../components/ModelConfigForm"
import { ModelProviderKeyEnum } from "@/utils/enums"
import { useMemo } from "react"
import { EditableModel, Model } from "@/types/model"
import { isFunction } from "es-toolkit"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { editModel } from "@/store/slices/modelSlice"

interface EditModelModalProps {
  // 是否打开弹窗
  isModalOpen?: boolean
  // 点击关闭弹窗或者点击蒙层关闭的回调
  onModalCancel?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  modelProviderKey?: ModelProviderKeyEnum;
  modelParams?: EditableModel;
}

/**
 * 编辑模型详情的弹窗
 */
const EditModelModal: React.FC<EditModelModalProps> = ({
  isModalOpen,
  onModalCancel,
  modelProviderKey,
  modelParams,
}) => {
  const { models } = useAppSelector(
    (state) => state.models,
  );
  const dispatch = useAppDispatch()

  const isOpen = useMemo(() => {
    return Boolean(isModalOpen ?? modelProviderKey)
  }, [isModalOpen, modelProviderKey])

  // 完成编辑校验成功后的回调
  const onEditFinish = async (model: Model) => {
    try {
      await dispatch(editModel({
        model,
        models,
      }))
      message.success('模型编辑成功')
    } catch {
      message.error('模型编辑失败')
    }

    // 让父组件关闭弹窗
    if (isFunction(onModalCancel)) {
      onModalCancel()
    }
  }


  return (
    <Modal
      open={isOpen}
      destroyOnHidden
      onCancel={onModalCancel}
      footer={null}
      maskClosable={false}
      style={{ top: 'calc(var(--spacing) * 6)' }}
      width={'60%'}
    >
      <div className="pt-6">
        {modelProviderKey && <ModelConfigForm
          modelProviderKey={modelProviderKey}
          modelParams={modelParams}
          onFinish={onEditFinish}
        />}
      </div>
    </Modal>
  )
}

export default EditModelModal