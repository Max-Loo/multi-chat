<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil, isString } from 'es-toolkit';
import { ArrowUp } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/store/chat';
import { useAppConfigStore } from '@/store/appConfig';
import { useChatPageSelectedChat } from '@/pages/Chat/composables/useSelectedChat';
import { useIsSending } from '@/pages/Chat/composables/useIsSending';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';

/**
 * 检测是否为 macOS 平台的 Safari 浏览器
 * 用于处理 Safari 中文输入法的 Enter 键 bug
 *
 * @returns 如果是 macOS Safari 则返回 true
 */
function isMacSafari(): boolean {
  const ua = navigator.userAgent;
  return (
    /Mac|macOS/.test(ua) && /Safari/.test(ua) && !/Chrome|Edge|Firefox/.test(ua)
  );
}

/**
 * 聊天内容发送框组件
 */
const { t } = useTranslation();
const chatStore = useChatStore();
const appConfigStore = useAppConfigStore();

// 获取是否传输推理内容的开关状态
const transmitHistoryReasoning = computed(
  () => appConfigStore.transmitHistoryReasoning,
);

const { selectedChat } = useChatPageSelectedChat();
const { isSending } = useIsSending();

// 要发送的内容
const text = ref('');

// 使用自动调整高度的 hook
const { textareaRef, isScrollable } = useAutoResizeTextarea(text, {
  minHeight: 60,
  maxHeight: 240,
});

/**
 * Textarea 组件 ref 绑定：组件实例需取根元素（原生 textarea）
 * @param el 组件实例或元素
 */
function setTextareaRef(el: unknown): void {
  const instance = el as { $el?: HTMLTextAreaElement } | null;
  textareaRef.value = instance?.$el ?? (el as HTMLTextAreaElement) ?? null;
}

// 保存取消事件
let abortController: AbortController | null = null;

/**
 * 发送消息
 * @param message 消息内容
 */
async function sendMessage(message: string): Promise<void> {
  if (!isString(message) || !message.trim()) {
    // 空消息不会发送
    return;
  }
  if (isNil(selectedChat.value)) {
    // 没有选中的聊天，无法发送
    return;
  }

  const signalController = new AbortController();

  // 将取消事件保存下来，以便中断（在发送前保存，确保点击停止时可用）
  abortController = signalController;

  try {
    await chatStore.startSendChatMessage(
      {
        chat: selectedChat.value!,
        message,
      },
      { signal: signalController.signal },
    );

    // 发送成功时清空输入框
    text.value = '';
  } catch {
    // 失败时保留内容以便用户修改后重试
  }
}

/**
 * 点击发送按钮：发送状态下点击为停止
 */
function onClickSendBtn(): void {
  if (isSending.value) {
    // 如果处于发送状态，停止上次的发送事件
    if (abortController) {
      abortController.abort(t('common.cancel'));
      abortController = null;
    }
    return;
  }

  sendMessage(text.value).catch(console.error);
}

// 记录最近一次 compositionEnd 事件的 timestamp
const compositionEndTimestamp = ref(0);

/**
 * 按下回车按钮的回调：直接回车是发送，shift + enter 是换行
 * @param e 键盘事件
 */
function onPressEnterBtn(e: KeyboardEvent): void {
  // 只有按下 Enter 键且没有按 Shift 键时才发送消息
  if (e.key === 'Enter' && !e.shiftKey) {
    // 阻止默认行为（换行）
    e.preventDefault();

    if (isSending.value) {
      // 如果处于发送状态，忽略回车事件
      return;
    }

    /**
     * Safari 中文输入法 Enter 键 bug 规避
     * @link https://bugs.webkit.org/show_bug.cgi?id=165004
     */
    if (isMacSafari() && Math.abs(e.timeStamp - compositionEndTimestamp.value) < 100) {
      return;
    }

    // 进行发送逻辑
    sendMessage(text.value).catch(console.error);
  }
}

/**
 * 记录输入法组合结束事件的时间戳
 * @param e 组合事件
 */
function onCompositionEnd(e: CompositionEvent): void {
  compositionEndTimestamp.value = e.timeStamp;
}
</script>

<!-- 聊天内容发送框组件 -->
<template>
  <form
    class="relative z-10 px-3 py-2 bg-background border border-gray-300 rounded-lg"
    data-testid="chat-panel-sender"
    @submit.prevent
  >
    <div class="flex flex-col">
      <Textarea
        :ref="setTextareaRef"
        v-model="text"
        :class="[
          'w-full text-base bg-background p-2 resize-none border-0 rounded-none shadow-none focus-visible:outline-none focus-visible:ring-0 transition-all scrollbar-thin',
        ]"
        :style="{ overflowY: isScrollable ? 'auto' : 'hidden' }"
        :placeholder="t('chat.typeMessage')"
        @keydown="onPressEnterBtn"
        @compositionend="onCompositionEnd"
      />

      <!-- 底部工具栏 -->
      <div class="flex items-center justify-between bg-background pt-2">
        <div>
          <!--
            推理内容开关（临时隐藏）
            隐藏原因：当前模型服务商不支持 Vercel AI SDK 的 `type: 'reasoning'` 消息格式
            恢复方式：移除下方按钮的 hidden class 即可
          -->
          <Button
            variant="outline"
            size="sm"
            hidden
            :title="t('chat.transmitHistoryReasoningHint')"
            :class="[
              'h-8 px-3 rounded-md transition-all duration-200',
              transmitHistoryReasoning
                ? 'border-blue-500 text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-500'
                : 'border-gray-300 text-gray-500 bg-white hover:border-gray-400 hover:text-gray-700',
            ]"
            @click="
              appConfigStore.setTransmitHistoryReasoning(!transmitHistoryReasoning)
            "
          >
            {{ t('chat.transmitHistoryReasoning') }}
          </Button>
        </div>

        <!-- 发送按钮：发送状态显示停止动画 -->
        <Button
          class="relative flex items-center justify-center p-0 h-8 w-8 rounded-full bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg transition-all group shrink-0"
          :disabled="false"
          :aria-label="
            isSending ? t('chat.stopSending') : t('chat.sendMessage')
          "
          :title="isSending ? t('chat.stopSending') : t('chat.sendMessage')"
          @click="onClickSendBtn"
        >
          <template v-if="isSending">
            <div
              class="absolute inset-0 border-4 rounded-full border-gray-300 border-t-gray-600 animate-spin"
            />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-2.5 h-2.5 bg-white rounded-sm" />
            </div>
          </template>
          <ArrowUp v-else :size="20" />
        </Button>
      </div>
    </div>
  </form>
</template>
