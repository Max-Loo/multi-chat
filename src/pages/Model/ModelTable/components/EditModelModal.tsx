import { Modal } from "antd"
import ModelConfigForm from "../../components/ModelConfigForm"
import { ModelProviderKeyEnum } from "@/utils/enums"
import { useMemo } from "react"

interface EditModelModalProps {
  // 是否打开弹窗
  isModalOpen?: boolean
  // 点击关闭弹窗或者点击蒙层关闭的回调
  onModalCancel?: (e: React.MouseEvent<HTMLButtonElement>) => void
  modelProviderKey?: ModelProviderKeyEnum
}

/**
 * 编辑模型详情的弹窗
 */
const EditModelModal: React.FC<EditModelModalProps> = ({
  isModalOpen,
  onModalCancel,
  modelProviderKey,
}) => {

  const isOpen = useMemo(() => {
    return Boolean(isModalOpen ?? modelProviderKey)
  }, [isModalOpen, modelProviderKey])

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
        />}
      </div>
    </Modal>
  )
}

export default EditModelModal