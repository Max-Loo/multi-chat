<script setup lang="ts">
/**
 * 具体渲染聊天内容的组件（Vue 版 Detail）
 *
 * 核心机制与 React 版保持一致：
 * - 虚拟化消息列表（历史 + 流式统一由 Virtualizer 管理）
 * - 流式自动跟随滚动（isAtBottom 保护，避免按钮闪现）
 * - 成对消息的历史索引双向同步
 * - 复制 / 行内编辑（editAndResendMessage）/ 重新生成（regenerateMessage）
 */
import { computed, ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Virtualizer } from 'virtua/vue';
import { Alert, AlertDescription } from '@/components/ui-vue/alert';
import { Button } from '@/components/ui-vue/button';
import { ArrowDown } from 'lucide-vue-next';
import DetailTitle from './DetailTitle.vue';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';
import ChatBubble from '@/components/chat/ChatBubble.vue';
import { useSelectedChat } from '@/composables/pages/useSelectedChat';
import { useIsSending } from '@/composables/pages/useIsSending';
import { isNotNil } from 'es-toolkit';
import { Spinner } from '@/components/ui-vue/spinner';
import { useChatStore } from '@/store/pinia/chat';
import { useModelStore } from '@/store/pinia/model';
import { useTranslation } from '@/composables/useTranslation';
import { getCurrentContent } from '@/services/chat/chatHistoryHelper';
import { copyToClipboard } from '@/utils/clipboard';
import { toastQueue } from '@/services/toast';
import type { ChatModel, StandardMessage } from '@/types/chat';

/** 滚动到底部的阈值（px） */
const SCROLL_BOTTOM_THRESHOLD = 24;

const props = defineProps<{ chatModel: ChatModel }>();

const { t } = useTranslation();
const chatStore = useChatStore();
const modelStore = useModelStore();
const { selectedChat } = useSelectedChat();
const { isSending } = useIsSending();

// 当前在运行的聊天数据（精确到 chatId + modelId）
const runningChatData = computed(() =>
  selectedChat.value ? chatStore.runningChat[selectedChat.value.id]?.[props.chatModel.modelId] : undefined,
);

// 成对消息的历史索引状态（消息 ID → 当前查看的历史索引）
const pairHistoryIndices = reactive<Record<string, number>>({});

// 当前正在重新生成的消息 ID
const regeneratingMessageId = ref<string | null>(null);

// 历史消息列表
const historyList = computed<StandardMessage[]>(() =>
  Array.isArray(props.chatModel.chatHistoryList) ? props.chatModel.chatHistoryList : [],
);

// 计算每条消息的操作属性（最新用户消息 / 最后一条 AI 回复）
const messageMeta = computed(() => {
  const result: Record<string, { isLatestUserMessage: boolean; isLastAssistant: boolean }> = {};

  let latestUserIndex = -1;
  let lastAssistantIndex = -1;
  for (let i = historyList.value.length - 1; i >= 0; i--) {
    if (lastAssistantIndex === -1 && historyList.value[i].role === 'assistant') {
      lastAssistantIndex = i;
    }
    if (latestUserIndex === -1 && historyList.value[i].role === 'user') {
      latestUserIndex = i;
    }
    if (latestUserIndex !== -1 && lastAssistantIndex !== -1) break;
  }

  historyList.value.forEach((msg, index) => {
    result[msg.id] = {
      isLatestUserMessage: index === latestUserIndex,
      isLastAssistant: index === lastAssistantIndex,
    };
  });

  return result;
});

// 合并列表：历史消息 + 流式消息
interface DisplayEntry {
  message: StandardMessage;
  displayMessage: StandardMessage;
  isRunning: boolean;
}

const displayList = computed<DisplayEntry[]>(() => {
  const list: DisplayEntry[] = historyList.value.map((msg) => ({
    message: msg,
    displayMessage: msg,
    isRunning: false,
  }));

  const runningHistory = runningChatData.value?.isSending ? runningChatData.value.history : null;
  const hasRunningContent =
    runningHistory && (getCurrentContent(runningHistory.content) || runningHistory.reasoningContent);

  if (hasRunningContent && runningHistory) {
    if (regeneratingMessageId.value) {
      // 重新生成模式：在原位置替换显示内容
      const targetIndex = list.findIndex((entry) => entry.message.id === regeneratingMessageId.value);
      if (targetIndex !== -1) {
        list[targetIndex] = {
          message: list[targetIndex].message,
          displayMessage: runningHistory,
          isRunning: true,
        };
      }
    } else {
      // 发送新消息模式：追加到末尾
      list.push({ message: runningHistory, displayMessage: runningHistory, isRunning: true });
    }
  }

  return list;
});

// 计算消息配对关系（用户消息 → 下一条 AI 回复，双向映射）
const messagePairs = computed(() => {
  const result: Record<string, string> = {};
  for (let i = 0; i < historyList.value.length - 1; i++) {
    if (
      historyList.value[i].role === 'user' &&
      historyList.value[i + 1].role === 'assistant'
    ) {
      result[historyList.value[i].id] = historyList.value[i + 1].id;
      result[historyList.value[i + 1].id] = historyList.value[i].id;
    }
  }
  return result;
});

// 成对同步回调
const historyCallbacks = computed(() => {
  const callbacks: Record<string, (index: number) => void> = {};
  for (const msgId of Object.keys(messagePairs.value)) {
    callbacks[msgId] = (index: number) => {
      const pairedId = messagePairs.value[msgId];
      pairHistoryIndices[msgId] = index;
      if (pairedId) pairHistoryIndices[pairedId] = index;
    };
  }
  return callbacks;
});

// 追踪每条消息的上一次 content.length，区分"编辑推送新版本"与"原地覆盖"
const prevContentLengths: Record<string, number> = {};

watch(displayList, (list) => {
  const newLengths: Record<string, number> = {};

  for (const { message } of list) {
    if (Array.isArray(message.content)) {
      const length = message.content.length;
      newLengths[message.id] = length;
      const prevLength = prevContentLengths[message.id];
      // 仅在长度增长时重置（编辑推送新版本）；首次出现或长度不变时跳过
      if (prevLength !== undefined && length > prevLength) {
        const maxIndex = length - 1;
        if (pairHistoryIndices[message.id] !== maxIndex) {
          pairHistoryIndices[message.id] = maxIndex;
        }
      }
    }
  }

  Object.assign(prevContentLengths, newLengths);
});

// 引用滚动容器
const scrollContainerRef = ref<HTMLDivElement | null>(null);

// 同步 displayList.length 到普通变量，供 scrollToBottom 稳定引用
let displayLength = displayList.value.length;
watch(
  () => displayList.value.length,
  (len) => {
    displayLength = len;
  },
);

// Title 引用（测量高度作为 startMargin）
const titleRef = ref<HTMLDivElement | null>(null);

// isAtBottom 的非响应式镜像
let isAtBottomMirror = true;
// 流式自动跟随期间保护 isAtBottom 状态
let isStreaming = false;

// Virtualizer 的 startMargin（Title 的高度）
const startMargin = ref(0);

// 控制滚动条的相关逻辑
const { onScrollEvent, scrollbarClassname, isScrolling } = useAdaptiveScrollbar();

// 是否需要滚动条（内容超出容器高度）
const needsScrollbar = ref(false);
// 是否在底部
const isAtBottom = ref(true);

/** 滚动到列表底部 */
const scrollToBottom = () => {
  virtualizerRef.value?.scrollToIndex(displayLength - 1, { align: 'end' });
};

// 检测是否需要滚动条以及是否在底部
const checkScrollStatus = () => {
  const container = scrollContainerRef.value;
  if (!container) return;

  const hasScrollbar = container.scrollHeight > container.clientHeight;
  needsScrollbar.value = hasScrollbar;

  // 流式自动跟随期间保护 isAtBottom 状态
  if (isStreaming && isAtBottomMirror) return;

  const atBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight <= SCROLL_BOTTOM_THRESHOLD;
  isAtBottom.value = atBottom;
  isAtBottomMirror = atBottom;
};

// Virtualizer 引用
const virtualizerRef = ref<InstanceType<typeof Virtualizer> | null>(null);

// 监听 Title 高度变化，更新 startMargin
let titleResizeObserver: ResizeObserver | null = null;
let containerResizeObserver: ResizeObserver | null = null;

onMounted(() => {
  const titleEl = titleRef.value;
  if (titleEl) {
    titleResizeObserver = new ResizeObserver(([entry]) => {
      startMargin.value = entry.contentRect.height;
    });
    titleResizeObserver.observe(titleEl);
  }

  const container = scrollContainerRef.value;
  if (container) {
    containerResizeObserver = new ResizeObserver(() => {
      checkScrollStatus();
    });
    containerResizeObserver.observe(container);
  }
});

onUnmounted(() => {
  titleResizeObserver?.disconnect();
  containerResizeObserver?.disconnect();
});

// 流式自动跟随：用户在底部且有流式数据更新时，等 DOM 更新后自动滚动到底部
watch(
  () => runningChatData.value,
  () => {
    if (isAtBottomMirror && runningChatData.value) {
      isStreaming = true;
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  },
);

// 内容变化时检测滚动状态
watch([() => displayList.value.length, () => runningChatData.value], () => {
  void nextTick().then(() => checkScrollStatus());
});

// Virtualizer 滚动事件处理
const handleVirtualizerScroll = (_offset: number) => {
  const container = scrollContainerRef.value;
  if (!container) return;

  const atBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight <= SCROLL_BOTTOM_THRESHOLD;
  isAtBottomMirror = atBottom;

  // 滚动回调中重置流式保护
  isStreaming = false;

  checkScrollStatus();
  onScrollEvent();
};

// 消息索引（复制用）
const messageMap = computed(() => {
  const map = new Map<string, StandardMessage>();
  for (const msg of historyList.value) {
    map.set(msg.id, msg);
  }
  return map;
});

const handleCopy = async (messageId: string) => {
  const message = messageMap.value.get(messageId);
  if (!message) return;
  try {
    await copyToClipboard(getCurrentContent(message.content));
    toastQueue.success(t('chat.copySuccess') as string);
  } catch {
    toastQueue.error(t('chat.copyFailed') as string);
  }
};

// 编辑消息回调
const handleEdit = (messageId: string, newContent: string) => {
  if (!selectedChat.value) return;
  void chatStore.editAndResendMessage({
    chatId: selectedChat.value.id,
    userMessageId: messageId,
    newContent,
  });
};

// 重新生成回调
const handleRegenerate = (messageId: string, historyIndex: number) => {
  if (!selectedChat.value) return;
  regeneratingMessageId.value = messageId;
  chatStore
    .regenerateMessage({
      chatId: selectedChat.value.id,
      assistantMessageId: messageId,
      historyIndex,
    })
    .finally(() => {
      regeneratingMessageId.value = null;
    });
};

// 是否展示流式 loading spinner（尚未产出内容）
const showSpinner = computed(
  () =>
    !!runningChatData.value?.isSending &&
    (!runningChatData.value.history ||
      (!getCurrentContent(runningChatData.value.history.content) &&
        !runningChatData.value.history.reasoningContent)),
);
</script>

<template>
  <div
    :class="`
      flex h-full flex-col items-center overflow-y-auto text-base
      pt-2 pb-4 pl-3
      ${isScrolling ? 'pr-0.5' : 'pr-3'}
      ${scrollbarClassname}
    `"
    ref="scrollContainerRef"
    data-testid="detail-scroll-container"
    role="log"
    :aria-label="t('common.a11y.chatMessages') as string"
  >
    <div ref="titleRef" class="w-full">
      <DetailTitle :chat-model="props.chatModel" />
    </div>

    <!-- 消息列表：虚拟化渲染（历史 + 流式统一管理） -->
    <div class="w-full">
      <Virtualizer
        ref="virtualizerRef"
        :data="displayList"
        :start-margin="startMargin"
        :scroll-ref="scrollContainerRef ?? undefined"
        @scroll="handleVirtualizerScroll"
      >
        <template #default="{ item }">
          <ChatBubble
            :role="item.message.role"
            :content="item.displayMessage.content"
            :reasoning-content="item.displayMessage.reasoningContent"
            :is-running="item.isRunning"
            :message-id="item.message.id"
            :is-latest-user-message="messageMeta[item.message.id]?.isLatestUserMessage"
            :is-last-assistant="messageMeta[item.message.id]?.isLastAssistant"
            :is-chat-sending="isSending"
            :history-index-override="pairHistoryIndices[item.message.id]"
            :on-history-index-change="messagePairs[item.message.id] ? historyCallbacks[item.message.id] : undefined"
            :on-copy="handleCopy"
            :on-edit="handleEdit"
            :on-regenerate="handleRegenerate"
          />
        </template>
      </Virtualizer>
    </div>

    <!-- 流式消息尚未产出内容时展示 loading spinner -->
    <div v-if="showSpinner" class="mt-3 flex w-full justify-start">
      <div class="flex items-center rounded-lg bg-muted px-4 py-3 text-muted-foreground">
        <Spinner class="size-4" />
      </div>
    </div>

    <!-- 展示可能的错误信息 -->
    <Alert v-if="isNotNil(selectedChat) && runningChatData?.errorMessage" variant="destructive" class="self-start">
      <AlertDescription>
        {{ runningChatData?.errorMessage }}
      </AlertDescription>
    </Alert>

    <!-- 滚动到底部按钮：需要滚动条且不在底部时才显示 -->
    <Button
      v-if="needsScrollbar && !isAtBottom"
      size="icon"
      class="absolute bottom-8 left-1/2 z-50 h-10 w-10 -translate-x-1/2 rounded-full bg-gray-900 text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg"
      :title="t('chat.scrollToBottom') as string"
      :aria-label="t('chat.scrollToBottom') as string"
      @click="scrollToBottom"
    >
      <template v-if="isSending">
        <div class="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-gray-300 border-t-gray-600 bg-white" />
        <div class="absolute inset-0 flex items-center justify-center">
          <ArrowDown class="text-gray-700" />
        </div>
      </template>
      <ArrowDown v-else />
    </Button>
  </div>
</template>
