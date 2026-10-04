<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { getProviderLogoUrl } from '@/utils/providerUtils';

/**
 * ProviderLogo 组件属性
 */
interface ProviderLogoProps {
  /** 供应商唯一标识 */
  providerKey: string;
  /** 供应商名称（用于降级显示和可访问性） */
  providerName: string;
  /** logo 容器尺寸，默认 40px */
  size?: number;
}

const props = withDefaults(defineProps<ProviderLogoProps>(), {
  size: 40,
});

/** logo 加载超时（防止网络挂起导致长时间等待） */
const LOGO_LOAD_TIMEOUT = 5000;

/** 错误状态：logo 加载失败或超时 */
const imgError = ref(false);
/** 加载状态：logo 是否成功加载 */
const imgLoaded = ref(false);
/** 是否已成功加载（供超时回调读取最新值） */
let imgLoadedFlag = false;

/** 加载超时定时器（providerKey 变化时重置） */
let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

// providerKey 变化时重置状态并重新计时超时
watch(
  () => props.providerKey,
  () => {
    if (loadTimeoutId) clearTimeout(loadTimeoutId);

    imgError.value = false;
    imgLoaded.value = false;
    imgLoadedFlag = false;

    // 超时后仍未加载成功则降级到首字母
    loadTimeoutId = setTimeout(() => {
      if (!imgLoadedFlag) {
        imgError.value = true;
      }
    }, LOGO_LOAD_TIMEOUT);
  },
  { immediate: true },
);

/** 首字母（大写，降级显示） */
const initialLetter = computed(() =>
  props.providerName.charAt(0).toUpperCase(),
);

/** logo 图片地址 */
const logoUrl = computed(() => getProviderLogoUrl(props.providerKey));

/** 图片加载成功回调 */
function onImgLoad(): void {
  imgLoadedFlag = true;
  imgLoaded.value = true;
}

/** 图片加载失败回调 */
function onImgError(): void {
  imgError.value = true;
}
</script>

<!--
  ProviderLogo 组件
  显示供应商 logo，支持渐进显示、错误降级
-->
<template>
  <div
    class="relative inline-block"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
  >
    <!-- 首字母占位符 - 始终渲染，通过 opacity 控制显示 -->
    <div
      class="flex items-center justify-center rounded-lg bg-primary/10 absolute inset-0 transition-opacity duration-300"
      :style="{ opacity: imgLoaded && !imgError ? 0 : 1 }"
      role="img"
      :aria-label="`${props.providerName} logo`"
    >
      <span class="font-bold text-primary" :style="{ fontSize: `${props.size * 0.5}px` }">
        {{ initialLetter }}
      </span>
    </div>

    <!-- Logo 图片 - 加载成功后淡入 -->
    <div
      v-if="!imgError"
      class="flex items-center justify-center rounded-lg bg-gray-100 absolute inset-0 transition-opacity duration-300"
      :style="{ opacity: imgLoaded ? 1 : 0 }"
    >
      <img
        :key="props.providerKey"
        :src="logoUrl"
        :alt="`${props.providerName} logo`"
        class="object-contain"
        :style="{
          filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))',
          maxWidth: `${props.size * 0.8}px`,
          maxHeight: `${props.size * 0.8}px`,
        }"
        @load="onImgLoad"
        @error="onImgError"
      />
    </div>
  </div>
</template>
