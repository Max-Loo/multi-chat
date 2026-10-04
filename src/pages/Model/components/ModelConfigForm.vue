<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { z } from 'zod';
import { useForm } from '@tanstack/vue-form';
import { generateId } from 'ai';
import dayjs from 'dayjs';
import { isBoolean } from 'es-toolkit';
import { OpenExternalBrowserButton } from '@/components/OpenExternalBrowserButton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';
import ModelSelect from './ModelSelect.vue';
import { useModelProviderStore } from '@/store/modelProvider';
import {
  DateFormatEnum,
  ModelProviderKeyEnum,
} from '@/utils/enums';
import type {
  EditableModel,
  ManualConfigModel,
  Model,
} from '@/types/model';

/**
 * 模型配置表单属性
 */
interface ModelConfigFormProps {
  /** 当前需要配置的模型供应商的 Key */
  modelProviderKey: ModelProviderKeyEnum;
  /** 表单校验成功后的回调，返回完整的模型数据 */
  onFinish?: (model: Model) => void;
  /** 编辑模式下传入的既有模型数据 */
  modelParams?: EditableModel;
}

const props = withDefaults(defineProps<ModelConfigFormProps>(), {
  modelParams: () => ({}),
  onFinish: () => {},
});

const { t } = useTranslation();
const modelProviderStore = useModelProviderStore();

/** 表单数据类型 */
interface FormValues {
  nickname: string;
  apiKey: string;
  apiAddress: string;
  remark?: string;
  modelKey: string;
}

// 当前配置的提供商的相关信息
const currentProvider = computed(() =>
  modelProviderStore.providers.find(
    (p) => p.providerKey === props.modelProviderKey,
  ),
);

// 表单的初始化值
const defaultValues = computed<FormValues>(() => ({
  nickname: props.modelParams.nickname || '',
  apiKey: props.modelParams.apiKey || '',
  apiAddress: props.modelParams.apiAddress || currentProvider.value?.api || '',
  remark: props.modelParams.remark || '',
  modelKey: props.modelParams.modelKey || '',
}));

// 表单验证 schema
const formSchema = z.object({
  nickname: z.string().trim().min(1, { message: t('model.modelNicknameRequired') }),
  apiKey: z.string().trim().min(1, { message: t('model.apiKeyRequired') }),
  apiAddress: z.string().trim().min(1, { message: t('model.apiAddressRequired') }),
  remark: z.string().optional(),
  modelKey: z.string().trim().min(1, { message: t('model.modelRequired') }),
});

/** 当前供应商可选择的模型列表（供应商缺失时为空数组） */
const providerModels = computed(() => currentProvider.value?.models ?? []);

/** 是否开启当前配置的模型，默认新建的时候是 true */
const isModelEnable = ref(
  isBoolean(props.modelParams?.isEnable) ? props.modelParams.isEnable : true,
);

const form = useForm({
  defaultValues: defaultValues.value,
  // TanStack Form 校验：显式执行 Zod 解析并返回逐字段错误映射
  validators: {
    onSubmit: ({ value }: { value: FormValues }) => {
      const result = formSchema.safeParse(value);
      if (result.success) return undefined;
      return result.error.flatten().fieldErrors;
    },
  },
  onSubmit: async ({ value }: { value: FormValues }) => {
    // 根据 modelKey 查找对应的 modelName
    const modelName =
      currentProvider.value?.models.find(
        (item) => item.modelKey === value.modelKey,
      )?.modelName || '';

    const fullModel: Model = getFullModelParams({
      ...value,
      // 添加 modelName 字段
      modelName,
      // 特殊处理「是否启用」的开关
      isEnable: isModelEnable.value,
    });

    props.onFinish(fullModel);
  },
});

/**
 * 获取拼装完整后的 model 参数
 * @param manualConfig 表单手工配置
 */
function getFullModelParams(manualConfig: ManualConfigModel): Model {
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
    providerName: currentProvider.value!.providerName,
    providerKey: currentProvider.value!.providerKey as ModelProviderKeyEnum,
    // 表单里面选择的是 modelKey，需要自己回填 modelName
    modelName:
      currentProvider.value?.models.find(
        (item) => item.modelKey === manualConfig.modelKey,
      )?.modelName || '',
  };
}

/** 逐字段 onChange 校验器（缺一即提示对应国际化文案） */
function requiredFieldValidator(message: string) {
  return ({ value }: { value: string }) => {
    const result = z
      .string()
      .trim()
      .min(1, { message })
      .safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };
}

const nicknameValidators = {
  onChange: requiredFieldValidator(t('model.modelNicknameRequired')),
};
const apiKeyValidators = {
  onChange: requiredFieldValidator(t('model.apiKeyRequired')),
};
const apiAddressValidators = {
  onChange: requiredFieldValidator(t('model.apiAddressRequired')),
};
const modelKeyValidators = {
  onChange: requiredFieldValidator(t('model.modelRequired')),
};

// 新增操作下，切换模型供应商的时候，对表单进行还原填充
watch(
  () => [props.modelProviderKey, props.modelParams?.id] as const,
  () => {
    if (!props.modelParams?.id) {
      form.reset({ ...defaultValues.value });
    }
  },
);

/**
 * apiAddress 失焦时的特殊逻辑：如果没有输入，重置为默认地址
 * @param field 字段 API
 */
function onApiAddressBlur(field: {
  handleBlur: () => void;
  state: { value: string };
  handleChange: (value: string) => void;
}): void {
  field.handleBlur();
  if (!field.state.value) {
    field.handleChange(currentProvider.value?.api || '');
  }
}

/**
 * 表单提交处理（阻止原生提交并触发 TanStack Form 校验与回调）
 * @param e 提交事件
 */
function onFormSubmit(e: Event): void {
  e.preventDefault();
  void form.handleSubmit();
}

/** 读取字段的第一个校验错误信息 */
function firstError(field: { state: { meta: { errors: unknown[] } } }): string {
  return (field.state.meta.errors as string[])[0] ?? '';
}
</script>

<!-- 编辑模型相关的表单 -->
<template>
  <div v-if="!currentProvider" class="text-destructive" data-testid="provider-error">
    Provider not found
  </div>

  <template v-else>
    <div class="flex items-center justify-between pt-2">
      <div class="flex items-center justify-start h-5 mb-4 text-xl">
        {{ currentProvider.providerName }}
        <!-- 点击跳转到 models.dev -->
        <OpenExternalBrowserButton site-url="https://models.dev" class="text-lg! ml-1" />
      </div>
      <Switch
        :model-value="isModelEnable"
        @update:model-value="(value: boolean) => (isModelEnable = value)"
      />
    </div>

    <form
      class="flex flex-wrap gap-4"
      data-testid="model-config-form"
      @submit.prevent="onFormSubmit"
    >
      <form.Field name="nickname" :validators="nicknameValidators" v-slot="{ field }">
        <div class="w-full grow xl:w-[calc(50%-16px)]" data-testid="form-field-nickname">
          <label class="text-base block mb-2" for="field-nickname">
            {{ t('model.modelNickname') }}
          </label>
          <Input
            id="field-nickname"
            :name="field.name"
            :model-value="field.state.value"
            @blur="field.handleBlur"
            @update:model-value="(value: string | number) => field.handleChange(String(value))"
          />
          <p v-if="firstError(field)" class="text-destructive text-sm mt-1">
            {{ firstError(field) }}
          </p>
        </div>
      </form.Field>

      <form.Field name="apiKey" :validators="apiKeyValidators" v-slot="{ field }">
        <div class="w-full grow xl:w-[calc(50%-16px)]" data-testid="form-field-apiKey">
          <label class="text-base block mb-2" for="field-apiKey">
            {{ t('model.apiKey') }}
          </label>
          <!-- PasswordInput 为 attrs 透传组件，需使用原生 value/input 形态 -->
          <PasswordInput
            id="field-apiKey"
            :name="field.name"
            :value="field.state.value"
            @blur="field.handleBlur"
            @input="field.handleChange(($event.target as HTMLInputElement).value)"
          />
          <p v-if="firstError(field)" class="text-destructive text-sm mt-1">
            {{ firstError(field) }}
          </p>
        </div>
      </form.Field>

      <form.Field name="apiAddress" :validators="apiAddressValidators" v-slot="{ field }">
        <div class="w-full grow xl:w-[calc(50%-16px)]" data-testid="form-field-apiAddress">
          <label class="text-base block mb-2" for="field-apiAddress">
            {{ t('model.apiAddress') }}
          </label>
          <Input
            id="field-apiAddress"
            :name="field.name"
            :model-value="field.state.value"
            @blur="onApiAddressBlur(field)"
            @update:model-value="(value: string | number) => field.handleChange(String(value))"
          />
          <p v-if="firstError(field)" class="text-destructive text-sm mt-1">
            {{ firstError(field) }}
          </p>
        </div>
      </form.Field>

      <form.Field name="remark" v-slot="{ field }">
        <div class="w-full grow xl:w-[calc(50%-16px)]" data-testid="form-field-remark">
          <label class="text-base block mb-2" for="field-remark">
            {{ t('common.remark') }}
          </label>
          <Textarea
            id="field-remark"
            :name="field.name"
            :model-value="field.state.value"
            @blur="field.handleBlur"
            @update:model-value="(value: string | number) => field.handleChange(String(value))"
          />
        </div>
      </form.Field>

      <form.Field name="modelKey" :validators="modelKeyValidators" v-slot="{ field }">
        <div class="w-full grow xl:w-[calc(50%-16px)]" data-testid="form-field-modelKey">
          <label class="text-base block mb-2">
            {{ t('model.model') }}
          </label>
          <ModelSelect
            :options="providerModels"
            :value="field.state.value"
            :error="firstError(field)"
            @update:value="(value: string) => field.handleChange(value)"
          />
        </div>
      </form.Field>

      <div class="flex items-center justify-end w-full grow">
        <Button type="submit" data-testid="submit-button">
          {{ t('common.submit') }}
        </Button>
      </div>
    </form>
  </template>
</template>
