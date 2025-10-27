import OpenExternalBrowserButton from "@/components/OpenExternalBrowserButton"
import { ManualConfigModel, Model, ModelProvider } from "@/types/model"
import { MODEL_PROVIDERS } from "@/utils/constants"
import { DateFormat, ModelProviderKeyEnum } from "@/utils/enums"
import type { FormItemProps } from "antd"
import { Button, Form, Input, Switch } from "antd"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import ModelSelect from "./ModelSelect"
import { v4 as uuidv4 } from 'uuid'
import dayjs from "dayjs"
import { isFunction } from "es-toolkit"

interface ModelConfigFormProps {
  // 当前需要配置的模型供应商的Key
  modelProviderKey: ModelProviderKeyEnum;
  // 表单校验成功后的回调，返回完整的模型数据
  onFinish?: (model: Model) => void
}

/**
 * 编辑模型相关的表单
 */
const ModelConfigForm: React.FC<ModelConfigFormProps> = ({
  modelProviderKey,
  onFinish,
}) => {
  const [form] = Form.useForm()

  // 当前配置的提供商的相关信息
  const currentProvider = useMemo(() => {
    return MODEL_PROVIDERS.find(provider => provider.key === modelProviderKey) as ModelProvider
  }, [modelProviderKey])

  // 表单的初始化值
  const initialFormValues = useMemo(() => {
    return {
      apiAddress: currentProvider.defaultConfig.apiAddress,
    }
  }, [currentProvider])

  // 新增操作下，切换模型供应商的时候，对表单进行还原填充
  useEffect(() => {
    form.resetFields()
  }, [form, currentProvider])

  // 是否开启当前配置的模型
  const [isModelEnable, setIsModelEnable] = useState(true)

  // 对应每个表单项的配置，采用数组渲染
  const formItemConfigs: Array<FormItemProps & { component?: ReactNode }> = [
    {
      label: '模型昵称',
      name: 'nickname',
      rules: [
        { required: true, message: '请输入当前模型的昵称' },
      ],
      component: <Input />,
    },
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
      label: '备注',
      name: 'remark',
      component: <Input.TextArea />,
    },
    {
      label: '模型',
      name: 'modelKey',
      component: <ModelSelect options={currentProvider.defaultConfig.modelList} />,
      rules: [
        { required: true, message: '请选择你想要使用的具体模型' },
      ],
    },
  ]




  // 表单校验成功后的回调
  const onFormFinish = (values: ManualConfigModel) => {
    const fullModel: Model = {
      ...values,
      id: uuidv4(),
      createdAt: dayjs().format(DateFormat.DAY_AND_TIME),
      updateAt: dayjs().format(DateFormat.DAY_AND_TIME),
      providerName: currentProvider.name,
      providerKey: currentProvider.key,
      // 表单里面选择的是 modelKey，需要自己回填 modelName
      modelName: currentProvider.defaultConfig.modelList.find(item => {
        return item.modelKey === values.modelKey
      })?.modelName || '',
    }

    if (isFunction(onFinish)) {
      onFinish(fullModel)
    }
  }

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
      onFinish={onFormFinish}
      className="flex flex-wrap gap-4"
      initialValues={initialFormValues}
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