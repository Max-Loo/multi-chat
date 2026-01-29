/**
 * 具体模型的选择器
 */

import { ModelDetail } from "@/types/model";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useFormField } from "@/components/ui/form"

interface ModelSelectProps {
  // 当前选择的模型的标识
  value?: string;
  // 可选项
  options: ModelDetail[];
  // @param value 选中的值
  onChange?: (value: string) => void;
  className?: string;
}

const ModelSelect: React.FC<ModelSelectProps> = ({
  value,
  options,
  onChange = () => {},
  className,
}) => {
  // 处理校验时的报错相关信息
  const { error } = useFormField()

  // 选中的值发生改变的回调
  // @param value 选中的值
  const onValueChange = (value: string): void => {
    onChange(value)
  }

  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      className={`
        flex flex-col border rounded-md border-gray-300
        ${error ? 'border-red-500' : ''}
        ${className}
      `}
    >
      { options.map(option => (
        <div
          key={option.modelKey}
          className="flex items-center space-x-2 p-2 border-b border-gray-200 last:border-0"
        >
          <RadioGroupItem value={option.modelKey} id={option.modelKey} />
          <label
            htmlFor={option.modelKey}
            className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            { option.modelName }
          </label>
        </div>
      ))}
    </RadioGroup>
  )
}

export default ModelSelect
