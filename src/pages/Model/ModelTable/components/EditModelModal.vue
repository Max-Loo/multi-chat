<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isBoolean } from 'es-toolkit';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm.vue';
import { useModelsStore } from '@/store/models';
import { toastQueue } from '@/services/toast';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { EditableModel, Model } from '@/types/model';

/**
 * 编辑模型详情的弹窗属性
 */
interface EditModelModalProps {
  /** 是否打开弹窗 */
  isModalOpen?: boolean;
  /** 弹窗内需要配置的供应商 Key */
  modelProviderKey?: ModelProviderKeyEnum;
  /** 编辑模式下的既有模型数据 */
  modelParams?: EditableModel;
}

const props = withDefaults(defineProps<EditModelModalProps>(), {
  isModalOpen: undefined,
  modelProviderKey: undefined,
  modelParams: () => ({}),
});

const emit = defineEmits<{
  /** 点击关闭弹窗或者点击蒙层关闭 */
  (e: 'modalCancel'): void;
}>();

const modelsStore = useModelsStore();
const { t } = useTranslation();

const isOpen = computed(() => {
  // 如果 isModalOpen 显式设置，则根据其状态控制开关弹窗
  if (isBoolean(props.isModalOpen)) {
    return props.isModalOpen;
  }
  // 如果 isModalOpen 未定义，则根据 modelProviderKey 决定
  return Boolean(props.modelProviderKey);
});

/**
 * 完成编辑校验成功后的回调
 * @param model 完整的模型数据
 */
function onEditFinish(model: Model): void {
  modelsStore
    .editModel({ model })
    .then(() => {
      toastQueue.success(t('model.editModelSuccess'));
    })
    .catch(() => {
      toastQueue.error(t('model.editModelFailed'));
    });

  // 让父组件关闭弹窗
  emit('modalCancel');
}
</script>

<!-- 编辑模型详情的弹窗 -->
<template>
  <Dialog
    :open="isOpen"
    @update:open="(open: boolean) => { if (!open) emit('modalCancel'); }"
  >
    <DialogContent class="max-w-[80%] top-[6%] translate-y-[calc(-6%+0px)]">
      <DialogHeader>
        <DialogTitle>{{ t('model.editModel') }}</DialogTitle>
        <DialogDescription>{{ t('model.editModelDescription') }}</DialogDescription>
      </DialogHeader>
      <ModelConfigForm
        v-if="props.modelProviderKey"
        :model-provider-key="props.modelProviderKey"
        :model-params="props.modelParams"
        :on-finish="onEditFinish"
      />
    </DialogContent>
  </Dialog>
</template>
