<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useTranslation } from 'i18next-vue'
import { cn } from '@/utils/utils'
import { Button } from '@/components/ui/button'

/**
 * 密码输入组件
 *
 * 提供带有显示/隐藏切换按钮的密码输入框
 * - 默认隐藏密码内容（type="password"）
 * - 点击眼睛图标可切换显示/隐藏状态
 * - 支持所有标准 input 属性（通过 attrs 透传，完全兼容 TanStack Form）
 */
const props = defineProps<{
  /** 自定义样式类 */
  class?: string
  /** 禁用状态 */
  disabled?: boolean
}>()

const { t } = useTranslation()

// 控制密码可见性状态，默认为隐藏
const showPassword = ref(false)

// 当前输入框类型
const inputType = computed(() => (showPassword.value ? 'text' : 'password'))

// 切换密码显示/隐藏状态
function togglePasswordVisibility(): void {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="relative">
    <!-- 密码输入框 -->
    <input
      :type="inputType"
      :class="cn(
        // 继承 Input 组件的基础样式
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        // 为右侧按钮预留空间
        'pr-10',
        props.class,
      )"
      v-bind="$attrs"
    >

    <!-- 显示/隐藏切换按钮 -->
    <Button
      type="button"
      variant="link"
      size="icon"
      :class="cn(
        // 绝对定位，固定在输入框右侧
        'absolute right-1 top-1/2 -translate-y-1/2',
        // 按钮颜色样式
        'text-muted-foreground hover:text-foreground',
        // 按钮尺寸调整（使用 h-8 w-8 以适应输入框高度 h-9）
        'h-8 w-8',
        // 确保按钮始终在浏览器自带的密码显示按钮之上
        'z-10',
        // 禁用状态样式
        props.disabled && 'cursor-not-allowed opacity-50',
      )"
      :aria-label="showPassword ? t('common.hide') : t('common.show')"
      :disabled="props.disabled"
      @click="togglePasswordVisibility"
    >
      <EyeOff v-if="showPassword" :size="16" />
      <Eye v-else :size="16" />
    </Button>
  </div>
</template>
