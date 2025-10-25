import OpenExternalBrowserButton from "@/components/OpenExternalBrowserButton"
import { ModelProvider } from "@/types/model"
import { MODEL_PROVIDERS } from "@/utils/constants"
import { ModelProviderKeyEnum } from "@/utils/enums"
import type { FormItemProps } from "antd"
import { Button, Form, Input, Switch } from "antd"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"

interface ModelConfigFormProps {
  // 当前需要配置的模型供应商的Key
  modelProviderKey: ModelProviderKeyEnum
}

const ModelConfigForm: React.FC<ModelConfigFormProps> = ({
  modelProviderKey,
}) => {
  const [form] = Form.useForm()

  // 当前配置的提供商的相关信息
  const currentProvider = useMemo(() => {
    return MODEL_PROVIDERS.find(provider => provider.key === modelProviderKey) as ModelProvider
  }, [modelProviderKey])

  // 是否开启当前配置的模型
  const [isModelEnable, setIsModelEnable] = useState(true)

  // 对应每个表单项的配置，采用数组渲染
  const formItemConfigs: Array<FormItemProps & {component?: ReactNode }> = [
    {
      label: 'API 密钥',
      name: 'apiKey',
      rules: [
        { required: true, message: '请输入你的 API 密钥' },
      ],
      component: <Input.Password />,
    },
    {
      label: 'API 地址',
      name: 'apiAddress',
      rules: [
        { required: true, message: '请输入服务商对应的 API 地址' },
      ],
      component: <Input />,
    },
    {
      label: '模型',
      name: 'modelKey',
      component: <Input />,
    },
  ]

  // 相关的数据发生变化的时候，对表单进行填充
  useEffect(() => {
    form.setFieldValue('apiAddress', currentProvider.defaultApiAddress)

  }, [form, currentProvider])

  return (<>
    <div className="flex items-center justify-between">
      <div className="flex items-center justify-start h-5 mb-4 text-xl">
        { currentProvider.name }
        {/* 点击跳转到官网 */}
        <OpenExternalBrowserButton
          siteUrl={currentProvider.officialSite}
          className="text-lg! ml-1"
        />
      </div>
      <Switch checked={isModelEnable} onChange={setIsModelEnable} />
    </div>
    <Form
      form={form}
      layout="inline"
      className="flex flex-wrap gap-4"
    >
      { formItemConfigs.map(item => (
        <Form.Item
          key={item.name}
          label={<span className="text-base">{item.label}</span>}
          name={item.name}
          layout="vertical"
          rules={item.rules}
          extra={item.extra}
          className="w-full grow xl:w-[calc(50%-16px)] mb-1!"
        >
          { item.component }
        </Form.Item>
      ))}
      <Form.Item label={null} className="flex items-center justify-end w-full grow">
        <Button type="primary" htmlType="submit">提交</Button>
      </Form.Item>
    </Form>
  </>)
}

export default ModelConfigForm