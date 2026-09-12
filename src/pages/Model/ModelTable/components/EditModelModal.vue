<script setup lang="ts">
/**
 * 编辑模型详情的弹窗（Vue 版 EditModelModal）
 * isModalOpen 显式控制开关；未传时根据 modelProviderKey 是否存在决定
 */
import { computed } from 'vue';
import { isBoolean } from 'es-toolkit';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui-vue/dialog';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm.vue';
import { useModelStore } from '@/store/pinia/model';
import { useTranslation } from '@/composables/useTranslation';
import { toastQueue } from '@/services/toast';
import type { EditableModel, Model } from '@/types/model';

const props = withDefaults(
  defineProps<{
    // 是否打开弹窗
    isModalOpen?: boolean;
    // 当前编辑的模型供应商 Key
    modelProviderKey?: string;
    // 编辑模式下的模型数据
    modelParams?: EditableModel;
  }>(),
  { modelParams: () => ({}) },
);

// 点击关闭弹窗或者点击蒙层关闭的回调
const emit = defineEmits<{ (e: 'modalCancel'): void }>();

const { t } = useTranslation();
const modelStore = useModelStore();

// 未显式传入 isModalOpen 时，根据 modelProviderKey 决定开关
const isOpen = computed(() =>
  isBoolean(props.isModalOpen) ? props.isModalOpen : Boolean(props.modelProviderKey),
);

// 完成编辑校验成功后的回调
const onEditFinish = (model: Model): void => {
  modelStore
    .editModel({ model })
    .then(() => {
      toastQueue.success(t('model.editModelSuccess') as string);
    })
    .catch(() => {
      toastQueue.error(t('model.editModelFailed') as string);
    });

  // 让父组件关闭弹窗
  emit('modalCancel');
};

const onModalCancel = () => emit('modalCancel');
</script>

<template>
  <Dialog
    :open="isOpen"
    class="max-w-[80%] top-[6%] translate-y-[calc(-6%+0px)]"
    @update:open="
      (open) => {
        if (!open) onModalCancel();
      }
    "
  >
    <DialogHeader>
      <DialogTitle>{{ t('model.editModel') }}</DialogTitle>
      <DialogDescription>{{ t('model.editModelDescription') }}</DialogDescription>
    </DialogHeader>
    <ModelConfigForm
      v-if="modelProviderKey"
      :model-provider-key="modelProviderKey"
      :model-params="modelParams"
      @finish="onEditFinish"
    />
  </Dialog>
</template>
