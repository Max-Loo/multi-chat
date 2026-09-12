<script setup lang="ts">
/**
 * 密码输入组件（Vue 版 PasswordInput）
 * 默认隐藏密码内容，点击眼睛图标可切换显示/隐藏
 */
import { computed, ref } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { cn } from '@/utils/utils';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{ class?: string; disabled?: boolean; name?: string; id?: string }>();

const model = defineModel<string>();

const { t } = useTranslation();

// 控制密码可见性状态，默认为隐藏
const showPassword = ref(false);

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const inputType = computed(() => (showPassword.value ? 'text' : 'password'));
</script>

<template>
  <div class="relative">
    <!-- 密码输入框 -->
    <input
      v-model="model"
      :type="inputType"
      :name="props.name"
      :id="props.id"
      :disabled="props.disabled"
      :class="
        cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'pr-10',
          props.class,
        )
      "
    />

    <!-- 显示/隐藏切换按钮 -->
    <Button
      type="button"
      variant="link"
      size="icon"
      :disabled="props.disabled"
      :class="
        cn(
          'absolute right-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground',
          props.disabled && 'cursor-not-allowed opacity-50',
        )
      "
      :aria-label="showPassword ? (t('common.hide') as string) : (t('common.show') as string)"
      @click="togglePasswordVisibility"
    >
      <EyeOff v-if="showPassword" size="16" />
      <Eye v-else size="16" />
    </Button>
  </div>
</template>
