<script setup lang="ts">
/**
 * 密码输入组件（对应旧版 password-input.tsx）
 * 提供带有显示/隐藏切换按钮的密码输入框，支持 v-model（与 TanStack Form 字段对接）
 */
import { ref, computed, type InputHTMLAttributes } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next';
import { cn } from '@/utils/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/composables/useTranslation';

/** 密码输入组件 props */
const props = defineProps<{
  /** 输入值（v-model，与 Form 字段同步） */
  modelValue?: string;
  class?: InputHTMLAttributes['class'];
  disabled?: boolean;
}>();

/** 值变化事件（供 Form 字段 handleChange 监听） */
const emit = defineEmits<{
  /** 输入值变化 */
  'update:modelValue': [value: string];
}>();

const { t } = useTranslation();

// 控制密码可见性状态，默认为隐藏
const showPassword = ref(false);

/** 切换密码显示/隐藏状态 */
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 合并输入框样式类（为右侧按钮预留空间）
const inputClasses = computed(() =>
  cn(
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    'pr-10',
    props.class,
  ),
);

// 切换按钮样式
const buttonClasses = computed(() =>
  cn(
    'absolute right-1 top-1/2 -translate-y-1/2',
    'text-muted-foreground hover:text-foreground',
    'h-8 w-8',
    'z-10',
    props.disabled && 'cursor-not-allowed opacity-50',
  ),
);

/** 输入处理：同步 v-model（缺失该同步会导致表单校验永远拿不到 apiKey） */
const handleInput = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
};
</script>

<template>
  <div class="relative">
    <input
      :type="showPassword ? 'text' : 'password'"
      :value="modelValue"
      :disabled="disabled"
      :class="inputClasses"
      @input="handleInput"
    />
    <Button
      variant="link"
      size="icon"
      :disabled="disabled"
      :class="buttonClasses"
      :aria-label="showPassword ? t('common.hide') : t('common.show')"
      @click="togglePasswordVisibility"
    >
      <EyeOff v-if="showPassword" :size="16" />
      <Eye v-else :size="16" />
    </Button>
  </div>
</template>
