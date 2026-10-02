<script setup lang="ts">
/**
 * 编辑模型详情的弹窗（对应旧版 EditModelModal.tsx）
 */
import { computed } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm.vue';
import { useModelStore } from '@/stores';
import { useTranslation } from '@/composables/useTranslation';
import { toastQueue } from '@/services/toast';
import { isBoolean } from 'es-toolkit';
import type {
  EditableModel,
  Model,
} from '@/types/model';
import type { ModelProviderKeyEnum } from '@/utils/enums';

/** 组件属性 */
const props = withDefaults(
  defineProps<{
    /** 是否打开弹窗 */
    isModalOpen?: boolean;
    /** 当前供应商 Key */
    modelProviderKey?: ModelProviderKeyEnum;
    /** 编辑中的模型参数 */
    modelParams?: EditableModel;
  }>(),
  { isModalOpen: undefined, modelProviderKey: undefined, modelParams: undefined },
);

/** 关闭弹窗事件 */
const emit = defineEmits<{
  /** 弹窗关闭 */
  cancel: [];
}>();

const modelStore = useModelStore();
const { t } = useTranslation();

// 开关逻辑：显式 isModalOpen 优先，否则根据 modelProviderKey 决定
const isOpen = computed(() => {
  if (isBoolean(props.isModalOpen)) {
    return props.isModalOpen;
  }
  return Boolean(props.modelProviderKey);
});

/** 完成编辑校验成功后的回调 */
const onEditFinish = (model: Model): void => {
  try {
    modelStore.editModel(model);
    void toastQueue.success(t('model.editModelSuccess'));
  } catch {
    void toastQueue.error(t('model.editModelFailed'));
  }

  // 让父组件关闭弹窗
  emit('cancel');
};

/** 关闭处理 */
const handleOpenChange = (open: boolean): void => {
  if (!open) emit('cancel');
};
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="max-w-[80%] top-[6%] translate-y-[calc(-6%+0px)]">
      <DialogHeader>
        <DialogTitle>{{ t('model.editModel') }}</DialogTitle>
        <DialogDescription>
          {{ t('model.editModelDescription') }}
        </DialogDescription>
      </DialogHeader>
      <ModelConfigForm
        v-if="modelProviderKey"
        :model-provider-key="modelProviderKey"
        :model-params="modelParams"
        @finish="onEditFinish"
      />
    </DialogContent>
  </Dialog>
</template>
