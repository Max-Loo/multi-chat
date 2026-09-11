<script setup lang="ts">
/**
 * ProviderLogo 组件（Vue 版）
 * 显示供应商 logo，支持渐进显示、错误降级和超时兜底，行为与 React 版保持一致
 */
import { ref, computed, watch, onUnmounted } from 'vue';
import { getProviderLogoUrl } from '@/utils/providerUtils';

const props = withDefaults(
  defineProps<{
    /** 供应商唯一标识 */
    providerKey: string;
    /** 供应商名称（用于降级显示和可访问性） */
    providerName: string;
    /** logo 容器尺寸，默认 40px */
    size?: number;
    class?: string;
  }>(),
  { size: 40 },
);

/** 防止网络挂起导致长时间等待的加载超时 */
const LOGO_LOAD_TIMEOUT = 5000;

const imgError = ref(false);
const imgLoaded = ref(false);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

// 超时机制与状态重置（providerKey 变化时）
watch(
  () => props.providerKey,
  () => {
    imgError.value = false;
    imgLoaded.value = false;

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (!imgLoaded.value) {
        imgError.value = true;
      }
    }, LOGO_LOAD_TIMEOUT);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId);
});

// 提取首字母（大写）
const initialLetter = computed(() => props.providerName.charAt(0).toUpperCase());
</script>

<template>
  <div
    :class="`relative inline-block ${props.class ?? ''}`"
    :style="{ width: props.size, height: props.size }"
  >
    <!-- 首字母占位符：始终渲染，通过 opacity 控制显示 -->
    <div
      class="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 transition-opacity duration-300"
      :style="{ opacity: imgLoaded && !imgError ? 0 : 1 }"
      role="img"
      :aria-label="`${props.providerName} logo`"
    >
      <span class="font-bold text-primary" :style="{ fontSize: props.size * 0.5 }">
        {{ initialLetter }}
      </span>
    </div>

    <!-- Logo 图片：加载成功后淡入 -->
    <div
      v-if="!imgError"
      class="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100 transition-opacity duration-300"
      :style="{ opacity: imgLoaded ? 1 : 0 }"
    >
      <img
        :key="props.providerKey"
        :src="getProviderLogoUrl(props.providerKey)"
        :alt="`${props.providerName} logo`"
        class="object-contain"
        :style="{
          filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))',
          maxWidth: props.size * 0.8,
          maxHeight: props.size * 0.8,
        }"
        @load="imgLoaded = true"
        @error="imgError = true"
      />
    </div>
  </div>
</template>
