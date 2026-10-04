<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNotNil } from 'es-toolkit';
import { ArrowDown } from 'lucide-vue-next';
import { Virtualizer } from 'virtua/vue';
// 类型导入不产生运行时引用（根入口含 React 代码，仅类型可安全引用）
import type { VirtualizerHandle } from 'virtua';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import Title from './Title.vue';
import ChatBubble from '@/components/chat/ChatBubble.vue';
import { ChatRoleEnum } from '@/types/chat';
import type { ChatModel, StandardMessage } from '@/types/chat';
import { useChatStore } from '@/store/chat';
import { useChatPageSelectedChat } from '@/pages/Chat/composables/useSelectedChat';
import { useIsSending } from '@/pages/Chat/composables/useIsSending';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';
import { getCurrentContent } from '@/services/chat/chatHistoryHelper';
import { copyToClipboard } from '@/utils/clipboard';
import { toastQueue } from '@/services/toast';

/** 滚动到底部的阈值（px） */
const SCROLL_BOTTOM_THRESHOLD = 24;

/**
 * 聊天内容详情属性
 */
interface DetailProps {
  /** 当前窗口的聊天模型配置 */
  chatModel: ChatModel;
}

const props = defineProps<DetailProps>();

const { t } = useTranslation();
const chatStore = useChatStore();
const { selectedChat } = useChatPageSelectedChat();
const { isSending } = useIsSending();

// 当前在运行的聊天数据（精确到 chatId + modelId）
const runningChatData = computed(() => {
  const chat = selectedChat.value;
  return chat
    ? chatStore.runningChat[chat.id]?.[props.chatModel.modelId]
    : undefined;
});

// 成对消息的历史索引状态（消息 ID → 当前查看的历史索引）
const pairHistoryIndices = ref<Record<string, number>>({});

// 当前正在重新生成的消息 ID（null 表示无重新生成或发送新消息）
const regeneratingMessageId = ref<string | null>(null);

// 历史消息列表
const historyList = computed<StandardMessage[]>(() =>
  Array.isArray(props.chatModel.chatHistoryList) ? props.chatModel.chatHistoryList : [],
);

// 计算每条消息的操作属性
const messageMeta = computed(() => {
  const result: Record<string, { isLatestUserMessage: boolean; isLastAssistant: boolean }> = {};

  const list = historyList.value;

  // 找到最后一条用户消息和最后一条 AI 回复的索引
  let latestUserIndex = -1;
  let lastAssistantIndex = -1;
  for (let i = list.length - 1; i >= 0; i--) {
    if (lastAssistantIndex === -1 && list[i].role === ChatRoleEnum.ASSISTANT) {
      lastAssistantIndex = i;
    }
    if (latestUserIndex === -1 && list[i].role === ChatRoleEnum.USER) {
      latestUserIndex = i;
    }
    if (latestUserIndex !== -1 && lastAssistantIndex !== -1) break;
  }

  list.forEach((msg, index) => {
    result[msg.id] = {
      isLatestUserMessage: index === latestUserIndex,
      isLastAssistant: index === lastAssistantIndex,
    };
  });

  return result;
});

// 合并列表：历史消息 + 流式消息（统一由 Virtualizer 管理）
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

  const runningHistory =
    runningChatData.value?.isSending ? runningChatData.value?.history : null;
  const hasRunningContent =
    runningHistory &&
    (getCurrentContent(runningHistory.content) || runningHistory.reasoningContent);

  if (hasRunningContent && runningHistory) {
    if (regeneratingMessageId.value) {
      // 重新生成模式：在原位置替换显示内容
      const targetIndex = list.findIndex(
        (entry) => entry.message.id === regeneratingMessageId.value,
      );
      if (targetIndex !== -1) {
        list[targetIndex] = {
          message: list[targetIndex].message,
          displayMessage: runningHistory,
          isRunning: true,
        };
      }
    } else {
      // 发送新消息模式：追加到末尾
      list.push({
        message: runningHistory,
        displayMessage: runningHistory,
        isRunning: true,
      });
    }
  }

  return list;
});

// 计算消息配对关系（用户消息 → 下一条 AI 回复，双向映射）
const messagePairs = computed(() => {
  const result: Record<string, string> = {};
  const list = historyList.value;
  for (let i = 0; i < list.length - 1; i++) {
    if (
      list[i].role === ChatRoleEnum.USER &&
      list[i + 1].role === ChatRoleEnum.ASSISTANT
    ) {
      result[list[i].id] = list[i + 1].id;
      result[list[i + 1].id] = list[i].id;
    }
  }
  return result;
});

/**
 * 生成消息的历史索引变更回调（成对同步）
 * @param messageId 消息 ID
 */
function makeHistoryCallback(messageId: string): (index: number) => void {
  return (index: number) => {
    const pairedId = messagePairs.value[messageId];
    pairHistoryIndices.value = {
      ...pairHistoryIndices.value,
      [messageId]: index,
      ...(pairedId ? { [pairedId]: index } : {}),
    };
  };
}

/** 追踪每条消息的上一次 content.length，用于区分「编辑推送新版本」与「原地覆盖」 */
let prevContentLengths: Record<string, number> = {};

// 当消息内容长度增长时（编辑推送新版本），重置历史索引到最新版本
watch(displayList, (list) => {
  const next: Record<string, number> = {};
  let changed = false;
  const newLengths: Record<string, number> = {};

  for (const { message } of list) {
    if (Array.isArray(message.content)) {
      const length = message.content.length;
      newLengths[message.id] = length;
      const prevLength = prevContentLengths[message.id];
      // 仅在长度增长时重置（编辑推送新版本）；首次出现或长度不变时跳过
      if (prevLength !== undefined && length > prevLength) {
        const maxIndex = length - 1;
        if (pairHistoryIndices.value[message.id] !== maxIndex) {
          next[message.id] = maxIndex;
          changed = true;
        }
      }
    }
  }

  prevContentLengths = newLengths;
  if (changed) {
    pairHistoryIndices.value = { ...pairHistoryIndices.value, ...next };
  }
});

// 引用滚动容器
const scrollContainerRef = ref<HTMLDivElement | null>(null);

// 同步 displayList.length 到 ref，供 scrollToBottom 稳定引用
let displayLength = 0;
watch(
  () => displayList.value.length,
  (length) => {
    displayLength = length;
  },
  { immediate: true },
);

// Virtualizer 引用
const virtualizerRef = ref<VirtualizerHandle | null>(null);

// Title 引用，用于测量高度作为 startMargin
const titleRef = ref<HTMLDivElement | null>(null);

// isAtBottom 的 ref 镜像，供 effect 读取避免重建
const isAtBottomRef = ref(true);

// 流式自动跟随期间保护 isAtBottom 状态，避免竞态导致按钮闪现
const isStreamingRef = ref(false);

// Virtualizer 的 startMargin（Title 的高度）
const startMargin = ref(0);

// 控制滚动条的相关逻辑
const { onScrollEvent, scrollbarClassname, isScrolling } = useAdaptiveScrollbar();

// 状态：是否需要滚动条（内容超出容器高度）
const needsScrollbar = ref(false);

// 状态：是否在底部
const isAtBottom = ref(true);

/**
 * 滚动到列表底部（流式/非流式统一使用 scrollToIndex）
 */
function scrollToBottom(): void {
  virtualizerRef.value?.scrollToIndex(displayLength - 1, { align: 'end' });
}

/**
 * 检测是否需要滚动条以及是否在底部
 */
function checkScrollStatus(): void {
  const container = scrollContainerRef.value;
  if (!container) return;

  // 检测是否需要滚动条（内容高度大于容器高度）
  const hasScrollbar = container.scrollHeight > container.clientHeight;
  if (needsScrollbar.value !== hasScrollbar) {
    needsScrollbar.value = hasScrollbar;
  }

  // 流式自动跟随期间保护 isAtBottom 状态：若正在流式跟随且原本在底部，跳过检测
  if (isStreamingRef.value && isAtBottomRef.value) return;

  // 检测是否在底部
  const atBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight <=
    SCROLL_BOTTOM_THRESHOLD;
  if (isAtBottom.value !== atBottom) {
    isAtBottom.value = atBottom;
  }
  isAtBottomRef.value = atBottom;
}

// 监听 Title 高度变化，更新 Virtualizer 的 startMargin
let titleResizeObserver: ResizeObserver | null = null;
onMounted(() => {
  const titleEl = titleRef.value;
  if (!titleEl) return;

  titleResizeObserver = new ResizeObserver(([entry]) => {
    startMargin.value = entry.contentRect.height;
  });
  titleResizeObserver.observe(titleEl);
});

// 流式自动跟随：当用户在底部且有流式数据更新时，等待 DOM 更新后自动滚动到底部
watch(runningChatData, () => {
  if (isAtBottomRef.value && runningChatData.value) {
    isStreamingRef.value = true;
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }
});

// ResizeObserver：监听容器尺寸变化
let containerResizeObserver: ResizeObserver | null = null;
onMounted(() => {
  const container = scrollContainerRef.value;
  if (!container) return;

  containerResizeObserver = new ResizeObserver(() => {
    checkScrollStatus();
  });
  containerResizeObserver.observe(container);
});

// 内容变化时检测滚动状态
watch([() => displayList.value.length, runningChatData], () => {
  nextTick(checkScrollStatus);
});

onBeforeUnmount(() => {
  titleResizeObserver?.disconnect();
  containerResizeObserver?.disconnect();
});

/**
 * Virtualizer 滚动事件处理
 * @param _offset 当前滚动偏移（未使用）
 */
function handleVirtualizerScroll(_offset: number): void {
  const container = scrollContainerRef.value;
  if (!container) return;

  const atBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight <=
    SCROLL_BOTTOM_THRESHOLD;
  isAtBottomRef.value = atBottom;

  // 滚动回调中重置流式保护，确保 auto-scroll 完成后或用户主动上滚时恢复正常检测
  isStreamingRef.value = false;

  checkScrollStatus();
  onScrollEvent();
}

/** 消息 ID → 消息对象的映射（供复制操作使用） */
const messageMap = computed(() => {
  const map = new Map<string, StandardMessage>();
  for (const msg of historyList.value) {
    map.set(msg.id, msg);
  }
  return map;
});

/**
 * 复制消息内容
 * @param messageId 消息 ID
 */
async function handleCopy(messageId: string): Promise<void> {
  const message = messageMap.value.get(messageId);
  if (!message) return;
  try {
    await copyToClipboard(getCurrentContent(message.content));
    toastQueue.success(t('chat.copySuccess'));
  } catch {
    toastQueue.error(t('chat.copyFailed'));
  }
}

/**
 * 编辑并重发消息
 * @param messageId 消息 ID
 * @param newContent 新内容
 */
function handleEdit(messageId: string, newContent: string): void {
  if (!selectedChat.value) return;
  void chatStore.editAndResendMessage({
    chatId: selectedChat.value.id,
    userMessageId: messageId,
    newContent,
  });
}

/**
 * 重新生成回复
 * @param messageId 助手消息 ID
 * @param historyIndex 历史索引
 */
function handleRegenerate(messageId: string, historyIndex: number): void {
  if (!selectedChat.value) return;
  regeneratingMessageId.value = messageId;
  Promise.resolve(
    chatStore.regenerateMessage({
      chatId: selectedChat.value.id,
      assistantMessageId: messageId,
      historyIndex,
    }),
  ).finally(() => {
    regeneratingMessageId.value = null;
  });
}

/** 流式消息尚未产出内容时展示 loading spinner */
const showRunningSpinner = computed(
  () =>
    runningChatData.value?.isSending &&
    (!runningChatData.value.history ||
      (!getCurrentContent(runningChatData.value.history.content) &&
        !runningChatData.value.history.reasoningContent)),
);
</script>

<!-- 具体渲染聊天内容的组件 -->
<template>
  <div
    :class="[
      'flex flex-col items-center text-base h-full overflow-y-auto pt-2 pb-4 pl-3',
      isScrolling ? 'pr-0.5' : 'pr-3',
      scrollbarClassname,
    ]"
    data-testid="detail-scroll-container"
    role="log"
    :aria-label="t('common.a11y.chatMessages')"
  >
    <div ref="titleRef" class="w-full">
      <Title :chat-model="props.chatModel" />
    </div>

    <!-- 消息列表 — 使用 Virtualizer 虚拟化渲染（历史 + 流式统一管理） -->
    <div class="w-full">
      <Virtualizer
        ref="virtualizerRef"
        :data="displayList"
        :start-margin="startMargin"
        :scroll-ref="scrollContainerRef ?? undefined"
        :scroll="handleVirtualizerScroll"
      >
        <template #default="{ item }">
          <ChatBubble
            :key="item.message.id"
            :role="item.message.role"
            :content="item.displayMessage.content"
            :reasoning-content="item.displayMessage.reasoningContent"
            :is-running="item.isRunning"
            :message-id="item.message.id"
            :is-latest-user-message="messageMeta[item.message.id]?.isLatestUserMessage"
            :is-last-assistant="messageMeta[item.message.id]?.isLastAssistant"
            :is-chat-sending="isSending"
            :history-index-override="pairHistoryIndices[item.message.id]"
            :on-history-index-change="
              messagePairs[item.message.id]
                ? makeHistoryCallback(item.message.id)
                : undefined
            "
            :on-copy="handleCopy"
            :on-edit="handleEdit"
            :on-regenerate="handleRegenerate"
          />
        </template>
      </Virtualizer>
    </div>

    <!-- 流式消息尚未产出内容时展示 loading spinner -->
    <div v-if="showRunningSpinner" class="w-full mt-3 flex justify-start">
      <div class="bg-muted text-muted-foreground px-4 py-3 rounded-lg flex items-center">
        <Spinner class="size-4" />
      </div>
    </div>

    <!-- 展示可能的错误信息 -->
    <Alert
      v-if="isNotNil(selectedChat) && runningChatData?.errorMessage"
      variant="destructive"
      class="self-start"
    >
      <AlertDescription>{{ runningChatData?.errorMessage }}</AlertDescription>
    </Alert>

    <!-- 滚动到底部按钮 - 只有当需要滚动条且不在底部时才显示 -->
    <Button
      v-if="needsScrollbar && !isAtBottom"
      class="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full h-10 w-10 bg-gray-900 text-white shadow-md hover:shadow-lg hover:bg-gray-800 transition-all z-50"
      :title="t('chat.scrollToBottom')"
      :aria-label="t('chat.scrollToBottom')"
      size="icon"
      @click="scrollToBottom"
    >
      <template v-if="isSending">
        <div
          class="absolute inset-0 border-4 rounded-full border-gray-300 border-t-gray-600 animate-spin w-full h-full bg-white"
        />
        <div class="absolute inset-0 flex items-center justify-center">
          <ArrowDown class="text-gray-700" />
        </div>
      </template>
      <ArrowDown v-else />
    </Button>
  </div>
</template>
