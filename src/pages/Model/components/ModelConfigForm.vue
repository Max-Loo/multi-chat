<script setup lang="ts">
/**
 * 编辑模型相关的表单（对应旧版 Model/components/ModelConfigForm.tsx）
 * 使用 @tanstack/vue-form + zod 校验
 */
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import OpenExternalBrowserButton from '@/components/OpenExternalBrowserButton/OpenExternalBrowserButton.vue';
import type { EditableModel, ManualConfigModel, Model } from '@/types/model';
import { DateFormatEnum, ModelProviderKeyEnum } from '@/utils/enums';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { useForm } from '@tanstack/vue-form';
import { ref } from 'vue';
import ModelSelect from './ModelSelect.vue';
import { generateId } from 'ai';
import dayjs from 'dayjs';
import { isBoolean } from 'es-toolkit';
import { useTranslation } from '@/composables/useTranslation';
import { useModelProviderStore } from '@/stores';

/** 组件属性 */
const props = withDefaults(
  defineProps<{
    /** 当前需要配置的模型供应商的 Key */
    modelProviderKey: ModelProviderKeyEnum;
    /** 当是编辑模式的时候，会传入此参数 */
    modelParams?: EditableModel;
  }>(),
  { modelParams: undefined },
);

/** 表单校验成功后的回调 */
const emit = defineEmits<{
  finish: [model: Model];
}>();

const { t } = useTranslation();
const modelProviderStore = useModelProviderStore();
const { providers } = storeToRefs(modelProviderStore);

// 当前配置的提供商的相关信息
const currentProvider = computed(() =>
  providers.value.find((p) => p.providerKey === props.modelProviderKey),
);

const hasProvider = computed(() => !!currentProvider.value);

const defaultModelList = computed(
  () => currentProvider.value?.models ?? [],
);
const apiUrl = computed(() => currentProvider.value?.api ?? '');

// 是否开启当前配置的模型，默认新建的时候是 true
const isModelEnable = ref(
  isBoolean(props.modelParams?.isEnable) ? props.modelParams!.isEnable : true,
);

// 表单级校验 schema（提交时全量校验）
const formSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, { message: t('model.modelNicknameRequired') }),
  apiKey: z.string().trim().min(1, { message: t('model.apiKeyRequired') }),
  apiAddress: z
    .string()
    .trim()
    .min(1, { message: t('model.apiAddressRequired') }),
  remark: z.string().optional(),
  modelKey: z.string().trim().min(1, { message: t('model.modelRequired') }),
});

/** 获取拼装完整后的 model 参数 */
const getFullModelParams = (manualConfig: ManualConfigModel): Model => {
  const provider = currentProvider.value!;
  if (props.modelParams?.id) {
    // 当有 id 的情况下，表明是编辑模型，特殊处理参数
    return {
      ...(props.modelParams as Model),
      id: props.modelParams.id,
      ...manualConfig,
      // 刷新更新时间
      updateAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
    };
  }

  // 否则返回一个全新的 model
  return {
    ...manualConfig,
    id: generateId(),
    createdAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
    updateAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
    providerName: provider.providerName,
    providerKey: provider.providerKey as ModelProviderKeyEnum,
    // 表单里面选择的是 modelKey，需要自己回填 modelName
    modelName:
      provider.models.find((item) => item.modelKey === manualConfig.modelKey)
        ?.modelName || '',
  };
};

// 表单校验成功后的回调
const onSubmit = async ({ value }: { value: FormValues }): Promise<void> => {
  // 根据 modelKey 查找对应的 modelName
  const modelName =
    defaultModelList.value.find((item) => item.modelKey === value.modelKey)
      ?.modelName || '';

  const fullModel: Model = getFullModelParams({
    ...value,
    // 添加 modelName 字段
    modelName,
    // 特殊处理「是否启用」的开关
    isEnable: isModelEnable.value,
  } as ManualConfigModel);

  emit('finish', fullModel);
};

/** 表单数据类型 */
interface FormValues {
  nickname: string;
  apiKey: string;
  apiAddress: string;
  remark?: string;
  modelKey: string;
}

// 创建表单实例
const form = useForm({
  defaultValues: {
    nickname: props.modelParams?.nickname || '',
    apiKey: props.modelParams?.apiKey || '',
    apiAddress: props.modelParams?.apiAddress || '',
    remark: props.modelParams?.remark || '',
    modelKey: props.modelParams?.modelKey || '',
  },
  // 提交时函数式校验（把 zod 错误映射为字段错误）
  validators: {
    onSubmit: ({ value }: { value: FormValues }) => {
      const result = formSchema.safeParse(value);
      if (result.success) return undefined;
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return fieldErrors;
    },
  },
  onSubmit,
});

// 字段级校验辅助：非空校验
const requiredValidator =
  (message: string) =>
  ({ value }: { value: string }): string | undefined => {
    const result = z
      .string()
      .trim()
      .min(1, { message })
      .safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };

// 新增操作下，切换模型供应商的时候，对表单进行还原填充（apiAddress 回填默认地址）
watch(
  [currentProvider, () => props.modelParams?.id],
  () => {
    if (!props.modelParams?.id) {
      form.reset({
        nickname: props.modelParams?.nickname || '',
        apiKey: props.modelParams?.apiKey || '',
        apiAddress: props.modelParams?.apiAddress || apiUrl.value,
        remark: props.modelParams?.remark || '',
        modelKey: props.modelParams?.modelKey || '',
      });
    }
  },
);

// 无 Provider 时不渲染表单主体
void hasProvider;
</script>

<template>
  <div v-if="!hasProvider" class="text-destructive" data-testid="provider-error">
    Provider not found
  </div>
  <template v-else>
    <div class="flex items-center justify-between pt-2">
      <div class="mb-4 flex h-5 items-center justify-start text-xl">
        {{ currentProvider!.providerName }}
        <!-- 点击跳转到 models.dev -->
        <OpenExternalBrowserButton
          site-url="https://models.dev"
          class-name="ml-1 text-lg!"
        />
      </div>
      <Switch v-model="isModelEnable" />
    </div>
    <Form :form="form">
      <form
        class="flex flex-wrap gap-4"
        data-testid="model-config-form"
        @submit.prevent="form.handleSubmit()"
      >
        <form.Field
          name="nickname"
          :validators="{ onChange: requiredValidator(t('model.modelNicknameRequired')) }"
          v-slot="{ field }"
        >
          <FormItem :field="field" class="w-full grow xl:w-[calc(50%-16px)]">
            <FormLabel class="text-base">
              {{ t('model.modelNickname') }}
            </FormLabel>
            <FormControl>
              <Input
                :name="field.name"
                :model-value="field.state.value"
                @update:model-value="(v: string) => field.handleChange(v)"
                @blur="field.handleBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </form.Field>

        <form.Field
          name="apiKey"
          :validators="{ onChange: requiredValidator(t('model.apiKeyRequired')) }"
          v-slot="{ field }"
        >
          <FormItem :field="field" class="w-full grow xl:w-[calc(50%-16px)]">
            <FormLabel class="text-base">
              {{ t('model.apiKey') }}
            </FormLabel>
            <FormControl>
              <PasswordInput
                :name="field.name"
                :model-value="field.state.value"
                @update:model-value="(v: string) => field.handleChange(v)"
                @blur="field.handleBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </form.Field>

        <form.Field
          name="apiAddress"
          :validators="{ onChange: requiredValidator(t('model.apiAddressRequired')) }"
          v-slot="{ field }"
        >
          <FormItem :field="field" class="w-full grow xl:w-[calc(50%-16px)]">
            <FormLabel class="text-base">
              {{ t('model.apiAddress') }}
            </FormLabel>
            <FormControl>
              <Input
                :name="field.name"
                :model-value="field.state.value"
                @update:model-value="(v: string) => field.handleChange(v)"
                @blur="() => {
                  field.handleBlur();
                  // 失焦时的特殊逻辑：如果没有输入，重置为默认地址
                  if (!field.state.value) {
                    field.handleChange(apiUrl);
                  }
                }"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </form.Field>

        <form.Field name="remark" v-slot="{ field }">
          <FormItem :field="field" class="w-full grow xl:w-[calc(50%-16px)]">
            <FormLabel class="text-base">
              {{ t('common.remark') }}
            </FormLabel>
            <FormControl>
              <Textarea
                :name="field.name"
                :model-value="field.state.value"
                @update:model-value="(v: string) => field.handleChange(v)"
                @blur="field.handleBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </form.Field>

        <form.Field
          name="modelKey"
          :validators="{ onChange: requiredValidator(t('model.modelRequired')) }"
          v-slot="{ field }"
        >
          <FormItem :field="field" class="w-full grow xl:w-[calc(50%-16px)]">
            <FormLabel class="text-base">
              {{ t('model.model') }}
            </FormLabel>
            <FormControl>
              <ModelSelect
                :options="defaultModelList"
                :model-value="field.state.value"
                @update:model-value="(v: string) => field.handleChange(v)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </form.Field>

        <FormItem class="flex w-full grow items-center justify-end">
          <Button type="submit" data-testid="submit-button">
            {{ t('common.submit') }}
          </Button>
        </FormItem>
      </form>
    </Form>
  </template>
</template>
