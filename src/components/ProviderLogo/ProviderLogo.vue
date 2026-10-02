<script setup lang="ts">
/**
 * 供应商 Logo 组件（对应旧版 ProviderLogo/index.tsx）
 * 显示供应商 logo，支持渐进显示、错误降级和性能优化
 */
import { ref, watch, onScopeDispose } from 'vue';
import { getProviderLogoUrl } from '@/utils/providerUtils';

/** 组件属性 */
const props = withDefaults(
  defineProps<{
    /** 供应商唯一标识 */
    providerKey: string;
    /** 供应商名称（用于降级显示和可访问性） */
    providerName: string;
    /** logo 容器尺寸，默认 40px */
    size?: number;
    /** 自定义类名 */
    className?: string;
  }>(),
  { size: 40, className: '' },
);

/** 超时常量：防止网络挂起导致长时间等待（5 秒） */
const LOGO_LOAD_TIMEOUT = 5000;

// 错误状态：logo 加载失败或超时
const imgError = ref(false);
// 加载状态：logo 是否成功加载
const imgLoaded = ref(false);
// 使用同步 ref 避免闭包陷阱（在 setTimeout 回调中读取最新值）
let imgLoadedSync = false;

let timeoutId: ReturnType<typeof setTimeout> | null = null;

// 超时机制和状态重置（providerKey 变化时）
watch(
  () => props.providerKey,
  () => {
    imgError.value = false;
    imgLoaded.value = false;
    imgLoadedSync = false;

    if (timeoutId) clearTimeout(timeoutId);
    // 设置超时：超时后仍未加载成功则降级到首字母
    timeoutId = setTimeout(() => {
      if (!imgLoadedSync) {
        imgError.value = true;
      }
    }, LOGO_LOAD_TIMEOUT);
  },
  { immediate: true },
);

onScopeDispose(() => {
  if (timeoutId) clearTimeout(timeoutId);
});

// 提取首字母（大写）
const initialLetter = props.providerName.charAt(0).toUpperCase();

/** 图片加载成功 */
const handleLoad = (): void => {
  imgLoadedSync = true;
  imgLoaded.value = true;
};

/** 图片加载失败 */
const handleError = (): void => {
  imgError.value = true;
};
</script>

<template>
  <div
    :class="`relative inline-block ${className}`"
    :style="{ width: size, height: size }"
  >
    <!-- 首字母占位符 - 始终渲染，通过 opacity 控制显示 -->
    <div
      class="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 transition-opacity duration-300"
      :style="{ opacity: imgLoaded && !imgError ? 0 : 1 }"
      role="img"
      :aria-label="`${providerName} logo`"
    >
      <span class="font-bold text-primary" :style="{ fontSize: size * 0.5 }">
        {{ initialLetter }}
      </span>
    </div>

    <!-- Logo 图片 - 加载成功后淡入 -->
    <div
      v-if="!imgError"
      class="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100 transition-opacity duration-300"
      :style="{ opacity: imgLoaded ? 1 : 0 }"
    >
      <img
        :key="providerKey"
        :src="getProviderLogoUrl(providerKey)"
        :alt="`${providerName} logo`"
        class="object-contain"
        :style="{
          filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))',
          maxWidth: size * 0.8,
          maxHeight: size * 0.8,
        }"
        @load="handleLoad"
        @error="handleError"
      />
    </div>
  </div>
</template>
