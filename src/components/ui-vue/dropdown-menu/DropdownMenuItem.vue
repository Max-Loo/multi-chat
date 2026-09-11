<script setup lang="ts">
/** 下拉菜单项（shadcn-vue 版） */
import { DropdownMenuItem } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{
  class?: string;
  disabled?: boolean;
  value?: string;
}>();

const emit = defineEmits<{ (e: 'select', event: Event): void }>();
</script>

<template>
  <DropdownMenuItem
    :disabled="props.disabled"
    :value="props.value"
    :class="cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
      props.class,
    )"
    @select="emit('select', $event)"
  >
    <slot />
  </DropdownMenuItem>
</template>
