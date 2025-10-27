/**
 * 具体模型的选择器
 */

import { ModelDetail } from "@/types/model";
import { Form, Radio } from "antd"
import { isFunction } from "es-toolkit";

interface ModelSelectProps {
  // 当前选择的模型的标识
  value?: string;
  // 可选项
  options: ModelDetail[];
  onChange?: (value: string) => void;
  className?: string;
}

const ModelSelect: React.FC<ModelSelectProps> = ({
  options,
  onChange,
  className,
}) => {
  // 处理校验时的报错相关信息
  const {
    status,
  } = Form.Item.useStatus()


  // 选中的值发生改变的回调
  const onValueChange = (value: string): void => {
    if (isFunction(onChange)) {
      onChange(value)
    }
  }

  return (
    <Radio.Group
      className={ `
        flex! flex-col! border rounded-md border-gray-300
        ${className}
        ${status === 'error' ? 'border-red-500' : ''}`
      }
      onChange={(e) => onValueChange(e.target.value)}
    >
      { options.map(option => (
        <Radio
          key={option.modelKey}
          value={option.modelKey}
          className="p-2! border-b border-gray-200 last:border-0 m-0!"
        >
          { option.modelName }
        </Radio>
      ))}
    </Radio.Group>
  )
}

export default ModelSelect