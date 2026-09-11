<script setup lang="ts">
/**
 * 聊天内容发送框组件（Vue 版 Sender）
 * 回车发送（含 macOS Safari 中文输入法 hack）、发送中可中断
 */
import { computed, ref } from 'vue';
import { ArrowUp } from 'lucide-vue-next';
import { isNil, isString } from 'es-toolkit';
import { Button } from '@/components/ui-vue/button';
import { useSelectedChat } from '@/composables/pages/useSelectedChat';
import { useIsSending } from '@/composables/pages/useIsSending';
import { useChatStore } from '@/store/pinia/chat';
import { useAppConfigStore } from '@/store/pinia/appConfig';
import { useTranslation } from '@/composables/useTranslation';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';

const { t } = useTranslation();
const chatStore = useChatStore();
const appConfigStore = useAppConfigStore();
const { selectedChat } = useSelectedChat();
const { isSending } = useIsSending();

// 获取是否传输推理内容的开关状态
const transmitHistoryReasoning = computed(() => appConfigStore.transmitHistoryReasoning);

// 要发送的内容
const text = ref('');

// 使用自动调整高度的组合式函数
const { textareaRef, isScrollable } = useAutoResizeTextarea(text, {
  minHeight: 60,
  maxHeight: 240,
});

// 保存取消事件
let abortController: AbortController | null = null;

// 发送消息
const sendMessage = async (message: string) => {
  if (!isString(message) || !message.trim()) {
    // 空消息不会发送
    return;
  }
  if (isNil(selectedChat.value)) {
    // 没有选中的聊天，无法发送
    return;
  }

  const controller = new AbortController();

  // 将取消事件保存下来，以便中断（在发起前保存，确保点击停止时可用）
  abortController = controller;

  try {
    await chatStore.startSendChatMessage(
      {
        chat: selectedChat.value,
        message,
      },
      { signal: controller.signal },
    );

    // 发送成功时清空输入框
    text.value = '';
  } catch {
    // 发送失败时保留内容以便用户修改后重试
  }
};

// 点击发送按钮：发送中则中断
const onClickSendBtn = () => {
  if (isSending.value) {
    if (abortController) {
      abortController.abort(t('common.cancel') as string);
      abortController = null;
    }
    return;
  }

  void sendMessage(text.value).catch(console.error);
};

// 记录最近一次 compositionEnd 事件的 timestamp
const compositionEndTimestamp = ref(0);

/** 检测是否为 macOS 平台的 Safari 浏览器（中文输入法 Enter 键 bug hack） */
const isMacSafari = (): boolean => {
  const ua = navigator.userAgent;
  return /Mac|macOS/.test(ua) && /Safari/.test(ua) && !/Chrome|Edge|Firefox/.test(ua);
};

// 按下回车：直接回车发送，shift + enter 换行
const onPressEnterBtn = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();

    if (isSending.value) {
      return;
    }

    // Safari 中文输入法 hack：compositionEnd 与 keyDown 间隔过短时忽略
    if (isMacSafari() && Math.abs(e.timeStamp - compositionEndTimestamp.value) < 100) {
      return;
    }

    void sendMessage(text.value).catch(console.error);
  }
};
</script>

<template>
  <form
    class="relative z-10 rounded-lg border border-gray-300 bg-background px-3 py-2"
    data-testid="chat-panel-sender"
    @submit.prevent
  >
    <div class="flex flex-col">
      <textarea
        ref="textareaRef"
        v-model="text"
        :placeholder="t('chat.typeMessage') as string"
        :style="{ overflowY: isScrollable ? 'auto' : 'hidden', height: 'auto' }"
        class="w-full resize-none rounded-none border-0 bg-background p-2 text-base shadow-none transition-all scrollbar-thin focus-visible:outline-none focus-visible:ring-0"
        @keydown="onPressEnterBtn"
        @compositionend="compositionEndTimestamp = $event.timeStamp"
      />

      <!-- 底部工具栏 -->
      <div class="flex items-center justify-between bg-background pt-2">
        <div>
          <!-- 推理内容开关（临时隐藏：待模型服务商支持推理内容后恢复，与 React 版一致） -->
          <Button
            variant="outline"
            size="sm"
            class="hidden h-8 rounded-md px-3 transition-all duration-200"
            :class="
              transmitHistoryReasoning
                ? 'border-blue-500 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-500'
                : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700'
            "
            :title="t('chat.transmitHistoryReasoningHint') as string"
            @click="appConfigStore.setTransmitHistoryReasoning(!transmitHistoryReasoning)"
          >
            {{ t('chat.transmitHistoryReasoning') }}
          </Button>
        </div>

        <!-- 发送按钮 -->
        <Button
          :disabled="false"
          class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 p-0 text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg"
          :aria-label="isSending ? (t('chat.stopSending') as string) : (t('chat.sendMessage') as string)"
          :title="isSending ? (t('chat.stopSending') as string) : (t('chat.sendMessage') as string)"
          @click="onClickSendBtn"
        >
          <template v-if="isSending">
            <div class="absolute inset-0 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="h-2.5 w-2.5 rounded-sm bg-white" />
            </div>
          </template>
          <ArrowUp v-else size="20" />
        </Button>
      </div>
    </div>
  </form>
</template>
