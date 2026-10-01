<script setup lang="ts">
/**
 * Vue3 迁移冒烟验证组件
 * 用于验证 SFC 编译与 @testing-library/vue 挂载链路
 */
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <div>
    <p role="status">Vue3 冒烟验证</p>
    <button type="button" @click="count++">点击次数：{{ count }}</button>
  </div>
</template>
