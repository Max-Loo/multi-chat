import OpenExternalBrowserButton from "@/components/OpenExternalBrowserButton"
import { EditableModel, ManualConfigModel, Model } from "@/types/model"
import { DateFormatEnum, ModelProviderKeyEnum } from "@/utils/enums"
import type { FormItemProps } from "antd"
import { Button, Form, Input, Switch } from "antd"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import ModelSelect from "./ModelSelect"
import { v4 as uuidv4 } from 'uuid'
import dayjs from "dayjs"
import { ModelProviderFactoryCreator } from "@/lib/factory/modelProviderFactory"
import { isBoolean } from "es-toolkit"


interface ModelConfigFormProps {
  // 当前需要配置的模型供应商的Key
  modelProviderKey: ModelProviderKeyEnum;
  // 表单校验成功后的回调，返回完整的模型数据
  onFinish?: (model: Model) => void;
  // 当是编辑模式的时候，会传入此参数
  modelParams?: EditableModel;
}

/**
 * 编辑模型相关的表单
 */
const ModelConfigForm: React.FC<ModelConfigFormProps> = ({
  modelProviderKey,
  onFinish = () => {},
  modelParams = {},
}) => {
  const [form] = Form.useForm()

  // 当前配置的提供商的相关信息
  const currentProvider = useMemo(() => {
    return ModelProviderFactoryCreator.getFactory(modelProviderKey).getModelProvider()
  }, [modelProviderKey])

  const {
    modelList: defaultModelList,
    apiAddress: apiAddressInstance,
  } = currentProvider

  // 表单的初始化值
  const initialFormValues = useMemo<EditableModel>(() => {
    return {
      apiAddress: apiAddressInstance.defaultApiAddress,
      ...modelParams,
    } satisfies EditableModel
  }, [apiAddressInstance, modelParams])

  // 新增操作下，切换模型供应商的时候，对表单进行还原填充
  useEffect(() => {
    form.resetFields()
  }, [form, currentProvider])

  // 是否开启当前配置的模型，默认新建的时候是 true
  const [isModelEnable, setIsModelEnable] = useState(isBoolean(modelParams?.isEnable) ? modelParams.isEnable : true)

  const apiAddressValue = Form.useWatch<string>('apiAddress', form)


  // 对应每个表单项的配置，采用数组渲染
  const formItemConfigs = useMemo<Array<FormItemProps & { component?: ReactNode }>>(() => {

    // 当输入 apiAddress 的输入框失焦的时候
    const onApiAddressBlur = () => {
      // 如果没有输入，则重置为默认地址
      if (!apiAddressValue) {
        form.setFieldValue('apiAddress', apiAddressInstance)
      }
    }

    return [
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
        // 动态填充 apiAddress 的 extra 信息
        extra: <>
          <div className="flex flex-wrap justify-between w-full gap4">
            <span className="max-w-full text-wrap wrap-anywhere">
              {apiAddressInstance.getOpenaiDisplayAddress(apiAddressValue)}
            </span>
            <span className="ml-auto">
              {apiAddressInstance.getAddressFormDescription?.() || '# 结尾表示自定义'}
            </span>
          </div>
        </>,
        component: <Input onBlur={onApiAddressBlur}/>,
      },
      {
        label: '备注',
        name: 'remark',
        component: <Input.TextArea />,
      },
      {
        label: '模型',
        name: 'modelKey',
        component: <ModelSelect options={defaultModelList} />,
        rules: [
          { required: true, message: '请选择你想要使用的具体模型' },
        ],
      },
    ]
  }, [form, defaultModelList, apiAddressValue, apiAddressInstance])

  // 获取拼装完整后的model参数
  const getFullModelParams = (manualConfig: ManualConfigModel): Model => {
    if (modelParams?.id) {
      // 当有id的情况下，表明是编辑模型，特殊处理参数
      return {
        ...(modelParams as Model),
        id: modelParams.id,
        ...manualConfig,
        // 刷新更新时间
        updateAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
      }
    }

    // 否则返回一个全新的model
    return {
      ...manualConfig,
      id: uuidv4(),
      createdAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
      updateAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
      providerName: currentProvider.name,
      providerKey: currentProvider.key,
      // 表单里面选择的是 modelKey，需要自己回填 modelName
      modelName: defaultModelList.find(item => {
        return item.modelKey === manualConfig.modelKey
      })?.modelName || '',
    }
  }

  // 表单校验成功后的回调
  const onFormFinish = (values: ManualConfigModel) => {
    const fullModel: Model = getFullModelParams({
      ...values,
      // 特殊处理「是否启用」的开关
      isEnable: isModelEnable,
    })
    onFinish(fullModel)
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