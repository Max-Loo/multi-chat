/* eslint-disable react/no-children-prop */
// TanStack Form 使用 render props 模式，需要使用 children prop

import OpenExternalBrowserButton from "@/components/OpenExternalBrowserButton"
import { EditableModel, ManualConfigModel, Model } from "@/types/model"
import { DateFormatEnum, ModelProviderKeyEnum } from "@/utils/enums"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import ModelSelect from "./ModelSelect"
import { generateId } from 'ai'
import dayjs from "dayjs"
import { isBoolean } from "es-toolkit"
import { useTranslation } from "react-i18next"
import { RootState } from "@/store"

interface ModelConfigFormProps {
  // 当前需要配置的模型供应商的Key
  modelProviderKey: ModelProviderKeyEnum;
  // 表单校验成功后的回调,返回完整的模型数据
  onFinish?: (model: Model) => void;
  // 当是编辑模式的时候,会传入此参数
  modelParams?: EditableModel;
}

/**
 * 表单数据类型推断
 */
type FormValues = {
  nickname: string
  apiKey: string
  apiAddress: string
  remark?: string
  modelKey: string
}

/**
 * 编辑模型相关的表单
 */
const ModelConfigForm: React.FC<ModelConfigFormProps> = ({
  modelProviderKey,
  onFinish = () => {},
  modelParams = {},
}) => {
  const { t } = useTranslation()

  // 当前配置的提供商的相关信息
  const currentProvider = useSelector((state: RootState) =>
    state.modelProvider.providers.find(p => p.providerKey === modelProviderKey)
  )

  if (!currentProvider) {
    return <div className="text-destructive">Provider not found</div>
  }

  const {
    models: defaultModelList,
    api: apiUrl,
  } = currentProvider

  // 表单的初始化值
  const defaultValues = useMemo<FormValues>(() => {
    return {
      nickname: modelParams.nickname || '',
      apiKey: modelParams.apiKey || '',
      apiAddress: modelParams.apiAddress || apiUrl,
      remark: modelParams.remark || '',
      modelKey: modelParams.modelKey || '',
    }
  }, [apiUrl, modelParams])

  // 表单验证 schema
  const formSchema = useMemo(() => z.object({
    nickname: z.string().trim().min(1, {
      message: t($ => $.model.modelNicknameRequired),
    }),
    apiKey: z.string().trim().min(1, {
      message: t($ => $.model.apiKeyRequired),
    }),
    apiAddress: z.string().trim().min(1, {
      message: t($ => $.model.apiAddressRequired),
    }),
    remark: z.string().optional(),
    modelKey: z.string().trim().min(1, {
      message: t($ => $.model.modelRequired),
    }),
  }), [t])

  // 是否开启当前配置的模型,默认新建的时候是 true
  const [isModelEnable, setIsModelEnable] = useState(isBoolean(modelParams?.isEnable) ? modelParams.isEnable : true)

  // 获取拼装完整后的model参数
  const getFullModelParams = (manualConfig: ManualConfigModel): Model => {
    if (modelParams?.id) {
      // 当有id的情况下,表明是编辑模型,特殊处理参数
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
      id: generateId(),
      createdAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
      updateAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
      providerName: currentProvider.providerName,
      providerKey: currentProvider.providerKey as ModelProviderKeyEnum,
      // 表单里面选择的是 modelKey,需要自己回填 modelName
      modelName: defaultModelList.find((item: { modelKey: string; modelName: string }) => {
        return item.modelKey === manualConfig.modelKey
      })?.modelName || '',
    }
  }

  // 表单校验成功后的回调
  const onSubmit = async ({ value }: { value: FormValues }) => {
    // 根据 modelKey 查找对应的 modelName
    const modelName = defaultModelList.find(item => {
      return item.modelKey === value.modelKey
    })?.modelName || ''

    const fullModel: Model = getFullModelParams({
      ...value,
      // 添加 modelName 字段
      modelName,
      // 特殊处理「是否启用」的开关
      isEnable: isModelEnable,
    })
    console.log(fullModel);
    
    onFinish(fullModel)
  }

  const form = useForm({
    defaultValues,
    // TanStack Form 原生支持 Zod，无需 resolver
    validators: {
      onSubmit: formSchema,
    },
    onSubmit,
  })

  // 新增操作下,切换模型供应商的时候,对表单进行还原填充
  useEffect(() => {
    if (!modelParams?.id) {
      form.reset()
    }
  }, [currentProvider, modelParams?.id, form])

  return (<>
    <div className="flex items-center justify-between">
      <div className="flex items-center justify-start h-5 mb-4 text-xl">
        {currentProvider.providerName}
        {/* 点击跳转到 models.dev */}
        <OpenExternalBrowserButton
          siteUrl={`https://models.dev`}
          className="text-lg! ml-1"
        />
      </div>
      <Switch checked={isModelEnable} onCheckedChange={setIsModelEnable} />
    </div>
    <Form form={form}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex flex-wrap gap-4"
      >
        <form.Field
          name="nickname"
          validators={{
            onChange: ({ value }) => {
              const result = z.string().trim().min(1, { message: t($ => $.model.modelNicknameRequired) }).safeParse(value)
              return result.success ? undefined : result.error.issues[0]?.message
            },
          }}
          children={(field) => (
            <FormItem field={field} className="w-full grow xl:w-[calc(50%-16px)]">
              <FormLabel className="text-base">{t($ => $.model.modelNickname)}</FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <form.Field
          name="apiKey"
          validators={{
            onChange: ({ value }) => {
              const result = z.string().trim().min(1, { message: t($ => $.model.apiKeyRequired) }).safeParse(value)
              return result.success ? undefined : result.error.issues[0]?.message
            },
          }}
          children={(field) => (
            <FormItem field={field} className="w-full grow xl:w-[calc(50%-16px)]">
              <FormLabel className="text-base">{t($ => $.model.apiKey)}</FormLabel>
              <FormControl>
                <PasswordInput
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <form.Field
          name="apiAddress"
          validators={{
            onChange: ({ value }) => {
              const result = z.string().trim().min(1, { message: t($ => $.model.apiAddressRequired) }).safeParse(value)
              return result.success ? undefined : result.error.issues[0]?.message
            },
          }}
          children={(field) => (
            <FormItem field={field} className="w-full grow xl:w-[calc(50%-16px)]">
              <FormLabel className="text-base">{t($ => $.model.apiAddress)}</FormLabel>
              <FormControl>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={() => {
                      field.handleBlur()
                      // 失焦时的特殊逻辑：如果没有输入，重置为默认地址
                      if (!field.state.value) {
                        field.handleChange(apiUrl)
                      }
                    }}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <form.Field
          name="remark"
          children={(field) => (
            <FormItem field={field} className="w-full grow xl:w-[calc(50%-16px)]">
              <FormLabel className="text-base">{t($ => $.common.remark)}</FormLabel>
              <FormControl>
                <Textarea
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <form.Field
          name="modelKey"
          validators={{
            onChange: ({ value }) => {
              const result = z.string().trim().min(1, { message: t($ => $.model.modelRequired) }).safeParse(value)
              return result.success ? undefined : result.error.issues[0]?.message
            },
          }}
          children={(field) => (
            <FormItem field={field} className="w-full grow xl:w-[calc(50%-16px)]">
              <FormLabel className="text-base">{t($ => $.model.model)}</FormLabel>
              <FormControl>
                <ModelSelect
                  options={defaultModelList}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem className="flex items-center justify-end w-full grow">
          <Button type="submit">{t($ => $.common.submit)}</Button>
        </FormItem>
      </form>
    </Form>
  </>)
}

export default ModelConfigForm
