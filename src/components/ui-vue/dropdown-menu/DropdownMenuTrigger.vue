<script setup lang="ts">
/**
 * 下拉菜单触发器（shadcn-vue 版）
 */
import { DropdownMenuTrigger } from 'reka-ui';
</script>

<template>
  <DropdownMenuTrigger as-child>
    <slot />
  </DropdownMenuTrigger>
</template>
