<script setup lang="ts">
/**
 * 聊天内容发送框组件（对应旧版 Panel/Sender.tsx）
 * Enter 发送、Shift+Enter 换行、发送中可停止；处理 Safari 中文输入法 Enter 兼容
 */
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { ArrowUp } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { isNil, isString } from 'es-toolkit';
import { useChatStore, useAppConfigStore } from '@/stores';
import { useSelectedChat } from '@/pages/Chat/composables/useSelectedChat';
import { useIsSending } from '@/pages/Chat/composables/useIsSending';
import { useTranslation } from '@/composables/useTranslation';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';

const { t } = useTranslation();
const chatStore = useChatStore();
const appConfigStore = useAppConfigStore();
const { transmitHistoryReasoning } = storeToRefs(appConfigStore);
const { selectedChat } = useSelectedChat();
const { isSending } = useIsSending();

// 要发送的内容
const text = ref('');

// 编辑用响应式别名（自动伸缩 hook 输入）
const textValue = ref('');
watch(text, (value) => {
  textValue.value = value;
});

// 使用自动调整高度的 hook
const { textareaRef, isScrollable } = useAutoResizeTextarea(textValue, {
  minHeight: 60,
  maxHeight: 240,
});

// textareaRef 经模板字符串 ref 绑定，显式引用避免 TS6133
void textareaRef;

// 保存取消事件
let abortController: AbortController | null = null;

/** 发送消息 */
const sendMessage = async (message: string): Promise<void> => {
  if (!isString(message) || !message.trim()) {
    // 空消息不会发送
    return;
  }
  if (isNil(selectedChat.value)) {
    // 没有选中的聊天，无法发送
    return;
  }

  const controller = new AbortController();

  // 将取消事件保存下来，以便中断（在发送前保存，确保点击停止时可用）
  abortController = controller;

  try {
    await chatStore.startSendChatMessage(
      {
        chat: selectedChat.value,
        message,
      },
      controller.signal,
    );

    // 发送成功时清空输入框，失败（含中断）时保留内容以便用户修改后重试
    text.value = '';
    textValue.value = '';
  } catch {
    // 失败保留内容（错误提示由 store 层写入 runningChat.errorMessage）
  }
};

/** 点击发送按钮 */
const onClickSendBtn = (): void => {
  if (isSending.value) {
    // 如果处于发送状态，停止上次的发送事件
    if (abortController) {
      abortController.abort(t('common.cancel'));
      abortController = null;
    }
    return;
  }

  void sendMessage(text.value).catch(console.error);
};

// 记录最近一次 compositionEnd 事件的 timestamp
const compositionEndTimestamp = ref(0);

/**
 * 检测是否为 macOS 平台的 Safari 浏览器
 */
const isMacSafari = (): boolean => {
  const ua = navigator.userAgent;
  return (
    /Mac|macOS/.test(ua) &&
    /Safari/.test(ua) &&
    !/Chrome|Edge|Firefox/.test(ua)
  );
};

/**
 * 按下回车按钮的回调，直接回车是发送，shift + enter 是换行
 */
const onPressEnterBtn = (e: KeyboardEvent): void => {
  // 只有按下 Enter 键且没有按 Shift 键时才发送消息
  if (e.key === 'Enter' && !e.shiftKey) {
    // 阻止默认行为（换行）
    e.preventDefault();

    if (isSending.value) {
      // 如果处于发送状态，忽略回车事件
      return;
    }

    /**
     * Safari 中文输入法 Enter 键 bug 兼容
     * @link https://bugs.webkit.org/show_bug.cgi?id=165004
     */
    if (
      isMacSafari() &&
      Math.abs(e.timeStamp - compositionEndTimestamp.value) < 100
    ) {
      return;
    }

    // 进行发送逻辑
    void sendMessage(text.value).catch(console.error);
  }
};

/** 切换推理内容传输开关（UI 当前隐藏，保留逻辑） */
const toggleTransmitHistoryReasoning = (): void => {
  appConfigStore.setTransmitHistoryReasoning(!transmitHistoryReasoning.value);
};
</script>

<template>
  <form
    class="relative z-10 rounded-lg border border-gray-300 bg-background px-3 py-2"
    data-testid="chat-panel-sender"
    @submit.prevent
  >
    <div class="flex flex-col">
      <Textarea
        ref="textareaRef"
        v-model="text"
        :placeholder="t('chat.typeMessage')"
        :style="{ overflowY: isScrollable ? 'auto' : 'hidden' }"
        class="w-full resize-none rounded-none border-0 bg-background p-2 text-base shadow-none focus-visible:outline-none focus-visible:ring-0 transition-all scrollbar-thin"
        @keydown="onPressEnterBtn"
        @compositionend="(e: CompositionEvent) => (compositionEndTimestamp = e.timeStamp)"
      />
      <!-- 底部工具栏 -->
      <div class="flex items-center justify-between bg-background pt-2">
        <div>
          <!--
            推理内容开关（临时隐藏，原因：供应商不支持 reasoning 消息格式）
            恢复方式：移除 hidden 类
          -->
          <Button
            variant="outline"
            size="sm"
            class="hidden h-8 rounded-md px-3 transition-all duration-200"
            :title="t('chat.transmitHistoryReasoningHint')"
            @click="toggleTransmitHistoryReasoning"
          >
            {{ t('chat.transmitHistoryReasoning') }}
          </Button>
        </div>
        <!-- 发送按钮 -->
        <Button
          class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 p-0 text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg"
          :aria-label="isSending ? t('chat.stopSending') : t('chat.sendMessage')"
          :title="isSending ? t('chat.stopSending') : t('chat.sendMessage')"
          @click="onClickSendBtn"
        >
          <template v-if="isSending">
            <div
              class="absolute inset-0 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"
            />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="h-2.5 w-2.5 rounded-sm bg-white" />
            </div>
          </template>
          <ArrowUp v-else :size="20" />
        </Button>
      </div>
    </div>
  </form>
</template>
