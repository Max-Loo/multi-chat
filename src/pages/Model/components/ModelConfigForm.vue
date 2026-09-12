<script setup lang="ts">
/**
 * 编辑模型相关的表单（Vue 版 ModelConfigForm）
 *
 * 表单方案为 design D5 降级路径：基于 zod 的自研轻量表单组合式函数（useZodForm）。
 * 字段：昵称 / API 密钥 / API 地址 / 备注 / 模型选择；提交时拼装完整模型数据。
 */
import { computed, watch } from 'vue';
import { z } from 'zod';
import { generateId } from 'ai';
import dayjs from 'dayjs';
import { isBoolean } from 'es-toolkit';
import OpenExternalBrowserButton from '@/components/OpenExternalBrowserButton/OpenExternalBrowserButton.vue';
import { Button } from '@/components/ui-vue/button';
import { Input } from '@/components/ui-vue/input';
import { PasswordInput } from '@/components/ui-vue/password-input';
import { Textarea } from '@/components/ui-vue/textarea';
import { Switch } from '@/components/ui-vue/switch';
import { Label } from '@/components/ui-vue/label';
import ModelSelect from './ModelSelect.vue';
import { useZodForm } from '@/composables/useZodForm';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { useTranslation } from '@/composables/useTranslation';
import { DateFormatEnum } from '@/utils/enums';
import type { EditableModel, ManualConfigModel, Model } from '@/types/model';

const props = withDefaults(
  defineProps<{
    // 当前需要配置的模型供应商的Key
    modelProviderKey: string;
    // 表单校验成功后的回调,返回完整的模型数据
    onFinish?: (model: Model) => void;
    // 当是编辑模式的时候,会传入此参数
    modelParams?: EditableModel;
  }>(),
  {
    onFinish: () => {},
    modelParams: () => ({}),
  },
);

const { t } = useTranslation();
const providerStore = useModelProviderStore();

// 当前配置的提供商的相关信息
const currentProvider = computed(() =>
  providerStore.providers.find((p) => p.providerKey === props.modelProviderKey),
);

// 供应商支持的默认模型列表与默认 API 地址
const defaultModelList = computed(() => currentProvider.value?.models ?? []);
const apiUrl = computed(() => currentProvider.value?.api ?? '');

// 表单的初始化值
const defaultValues = () => ({
  nickname: props.modelParams.nickname || '',
  apiKey: props.modelParams.apiKey || '',
  apiAddress: props.modelParams.apiAddress || apiUrl.value,
  remark: props.modelParams.remark || '',
  modelKey: props.modelParams.modelKey || '',
});

// 表单验证 schema（错误文案随语言变化）
const formSchema = computed(
  () =>
    z.object({
      nickname: z.string().trim().min(1, { message: t('model.modelNicknameRequired') as string }),
      apiKey: z.string().trim().min(1, { message: t('model.apiKeyRequired') as string }),
      apiAddress: z.string().trim().min(1, { message: t('model.apiAddressRequired') as string }),
      remark: z.string().optional(),
      modelKey: z.string().trim().min(1, { message: t('model.modelRequired') as string }),
    }),
);

// 轻量表单实例
const form = useZodForm({ defaultValues }, formSchema);

// 是否开启当前配置的模型,默认新建的时候是 true
const isModelEnable = defineModel<boolean>('isModelEnable');
isModelEnable.value = isBoolean(props.modelParams?.isEnable) ? props.modelParams.isEnable! : true;

// 新增操作下,切换模型供应商的时候,对表单进行还原填充
watch(currentProvider, () => {
  if (!props.modelParams?.id) {
    form.reset();
  }
});

/**
 * 获取拼装完整后的model参数
 * @param manualConfig 用户填写的配置
 */
const getFullModelParams = (manualConfig: ManualConfigModel): Model => {
  if (props.modelParams?.id) {
    // 当有id的情况下,表明是编辑模型,特殊处理参数
    return {
      ...(props.modelParams as Model),
      id: props.modelParams.id,
      ...manualConfig,
      // 刷新更新时间
      updateAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
    };
  }

  // 否则返回一个全新的model
  return {
    ...manualConfig,
    id: generateId(),
    createdAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
    updateAt: dayjs().format(DateFormatEnum.DAY_AND_TIME),
    providerName: currentProvider.value?.providerName ?? '',
    providerKey: currentProvider.value?.providerKey as never,
    // 表单里面选择的是 modelKey,需要自己回填 modelName
    modelName:
      defaultModelList.value.find((item) => item.modelKey === manualConfig.modelKey)?.modelName || '',
  };
};

// 提交按钮点击：触发整体校验并回调完整模型
const onSubmit = async () => {
  await form.handleSubmit(async (value) => {
    // 根据 modelKey 查找对应的 modelName
    const modelName =
      defaultModelList.value.find((item) => item.modelKey === value.modelKey)?.modelName || '';

    const fullModel: Model = getFullModelParams({
      ...value,
      // 添加 modelName 字段
      modelName,
      // 特殊处理「是否启用」的开关
      isEnable: isModelEnable.value ?? true,
    } as ManualConfigModel);

    props.onFinish(fullModel);
  });
};
</script>

<template>
  <!-- 供应商不存在时显示错误提示 -->
  <div v-if="!currentProvider" class="text-destructive" data-testid="provider-error">Provider not found</div>

  <template v-else>
    <div class="flex items-center justify-between pt-2">
      <div class="mb-4 flex h-5 items-center justify-start text-xl">
        {{ currentProvider.providerName }}
        <!-- 点击跳转到 models.dev -->
        <OpenExternalBrowserButton site-url="https://models.dev" class="ml-1 text-lg!" />
      </div>
      <Switch v-model="isModelEnable" />
    </div>

    <form
      class="flex flex-wrap gap-4"
      data-testid="model-config-form"
      @submit.prevent="onSubmit"
    >
      <!-- 模型昵称 -->
      <div class="grow w-full xl:w-[calc(50%-16px)]">
        <Label for="nickname" class="text-base">{{ t('model.modelNickname') }}</Label>
        <Input
          id="nickname"
          name="nickname"
          :model-value="form.values.nickname"
          @update:model-value="form.handleChange('nickname', $event)"
        />
        <p v-if="form.errors['nickname']" data-testid="form-message-error" class="text-sm text-destructive">
          {{ form.errors['nickname'] }}
        </p>
      </div>

      <!-- API 密钥 -->
      <div class="grow w-full xl:w-[calc(50%-16px)]">
        <Label for="apiKey" class="text-base">{{ t('model.apiKey') }}</Label>
        <PasswordInput
          id="apiKey"
          name="apiKey"
          :model-value="form.values.apiKey"
          @update:model-value="form.handleChange('apiKey', $event)"
        />
        <p v-if="form.errors['apiKey']" data-testid="form-message-error" class="text-sm text-destructive">
          {{ form.errors['apiKey'] }}
        </p>
      </div>

      <!-- API 地址 -->
      <div class="grow w-full xl:w-[calc(50%-16px)]">
        <Label for="apiAddress" class="text-base">{{ t('model.apiAddress') }}</Label>
        <Input
          id="apiAddress"
          name="apiAddress"
          :model-value="form.values.apiAddress"
          @update:model-value="form.handleChange('apiAddress', $event)"
          @blur="
            () => {
              // 失焦时的特殊逻辑：如果没有输入，重置为默认地址
              if (!form.values.apiAddress) {
                form.handleChange('apiAddress', apiUrl);
              }
            }
          "
        />
        <p v-if="form.errors['apiAddress']" data-testid="form-message-error" class="text-sm text-destructive">
          {{ form.errors['apiAddress'] }}
        </p>
      </div>

      <!-- 备注 -->
      <div class="grow w-full xl:w-[calc(50%-16px)]">
        <Label for="remark">{{ t('common.remark') }}</Label>
        <Textarea
          id="remark"
          name="remark"
          :model-value="form.values.remark"
          @update:model-value="form.handleChange('remark', $event)"
        />
      </div>

      <!-- 模型选择 -->
      <div class="grow w-full xl:w-[calc(50%-16px)]">
        <Label for="modelKey" class="text-base">{{ t('model.model') }}</Label>
        <ModelSelect
          :options="defaultModelList"
          :model-value="form.values.modelKey"
          :error="form.errors['modelKey']"
          @change="form.handleChange('modelKey', $event)"
        />
        <p v-if="form.errors['modelKey']" data-testid="form-message-error" class="text-sm text-destructive">
          {{ form.errors['modelKey'] }}
        </p>
      </div>

      <div class="flex w-full grow items-center justify-end">
        <Button type="submit" data-testid="submit-button">{{ t('common.submit') }}</Button>
      </div>
    </form>
  </template>
</template>
