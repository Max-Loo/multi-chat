<script setup lang="ts">
/**
 * 聊天气泡组件（Vue 版 ChatBubble）
 * 显示用户和 AI 助手的聊天气泡，支持 Markdown 渲染、操作工具栏、行内编辑和历史翻页
 * 行为与 React 版 ChatBubble.tsx 保持一致（Vue 响应式天然细粒度更新，无需 memo 比较）
 */
import { computed, ref, watch, nextTick } from 'vue';
import { Copy, Pencil, RefreshCw, Check, X } from 'lucide-vue-next';
import { Card } from '@/components/ui-vue/card';
import { Button } from '@/components/ui-vue/button';
import { ChatRoleEnum } from '@/types/chat';
import ThinkingSection from './ThinkingSection.vue';
import StreamingContent from './StreamingContent.vue';
import { useTranslation } from '@/composables/useTranslation';
import {
  getCurrentContent,
  getContentAtIndex,
} from '@/services/chat/chatHistoryHelper';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui-vue/pagination';

/**
 * 聊天气泡组件的属性接口
 */
interface Props {
  /** 消息角色 */
  role: ChatRoleEnum;
  /** 消息内容（string = 无编辑历史，string[] = 有编辑历史） */
  content: string | string[];
  /** 推理内容（可选，同 content 支持编辑历史） */
  reasoningContent?: string | string[];
  /** 是否正在生成中 */
  isRunning?: boolean;
  /** 消息唯一标识 */
  messageId?: string;
  /** 是否为最新用户消息（控制编辑按钮） */
  isLatestUserMessage?: boolean;
  /** 是否为最后一条 AI 回复（控制重新生成按钮） */
  isLastAssistant?: boolean;
  /** 复制回调 */
  onCopy?: (messageId: string) => void;
  /** 编辑回调 */
  onEdit?: (messageId: string, newContent: string) => void;
  /** 重新生成回调 */
  onRegenerate?: (messageId: string, historyIndex: number) => void;
  /** 聊天是否正在发送中（禁用编辑/重新生成按钮） */
  isChatSending?: boolean;
  /** 外部历史索引（成对展示时由父组件控制） */
  historyIndexOverride?: number;
  /** 历史索引变更回调（用于成对同步） */
  onHistoryIndexChange?: (index: number) => void;
}

const props = withDefaults(defineProps<Props>(), {
  isRunning: false,
  isChatSending: false,
});

const emit = defineEmits<{
  (e: 'historyIndexChange', index: number): void;
}>();

const { t } = useTranslation();
const isEditing = ref(false);
const editText = ref('');
const internalHistoryIndex = ref(Array.isArray(props.content) ? props.content.length - 1 : 0);

const { textareaRef, isScrollable } = useAutoResizeTextarea(editText, {
  minHeight: 60,
  maxHeight: 240,
});

// 使用外部索引（成对同步）或内部索引
const historyIndex = computed(() =>
  props.historyIndexOverride !== undefined ? props.historyIndexOverride : internalHistoryIndex.value,
);

// 当前版本的内容
const currentContent = computed(() => getContentAtIndex(props.content, historyIndex.value));

const currentReasoning = computed(() => {
  if (!props.reasoningContent) return undefined;
  return getContentAtIndex(props.reasoningContent, historyIndex.value);
});

// 当 content 外部更新时（如编辑确认后），重置内部 historyIndex 到最新
watch(
  () => props.content,
  (content) => {
    if (Array.isArray(content)) {
      internalHistoryIndex.value = content.length - 1;
      if (props.historyIndexOverride === undefined) {
        emit('historyIndexChange', content.length - 1);
      }
    }
  },
);

// 推理内容的加载状态
const thinkingLoading = computed(() => props.isRunning && !currentContent.value);

// 是否显示操作栏（始终显示，发送期间通过 disabled 禁用按钮）
const showActions = computed(() => !!props.messageId);

// 进入编辑模式
const handleStartEdit = () => {
  editText.value = getCurrentContent(props.content);
  isEditing.value = true;
  // 延迟聚焦以确保 DOM 已更新
  void nextTick().then(() => {
    textareaRef.value?.focus();
    textareaRef.value?.setSelectionRange(
      textareaRef.value.value.length,
      textareaRef.value.value.length,
    );
  });
};

// 确认编辑
const handleConfirmEdit = () => {
  const trimmed = editText.value.trim();
  if (!trimmed) return;
  if (props.messageId && props.onEdit) {
    props.onEdit(props.messageId, trimmed);
  }
  isEditing.value = false;
};

// 取消编辑
const handleCancelEdit = () => {
  isEditing.value = false;
  editText.value = '';
};

// 编辑模式的键盘事件
const handleEditKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleConfirmEdit();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    handleCancelEdit();
  }
};

// 翻页回调：同步更新内部状态并通知父组件
const handleHistoryIndexChange = (index: number) => {
  internalHistoryIndex.value = index;
  emit('historyIndexChange', index);
};

const handleCopy = () => {
  if (props.messageId && props.onCopy) props.onCopy(props.messageId);
};
</script>

<template>
  <!-- 用户对话气泡 -->
  <div
    v-if="props.role === ChatRoleEnum.USER"
    class="mr-2 mt-3 flex w-full justify-end"
    data-testid="user-message"
    :aria-label="t('common.a11y.userMessage') as string"
  >
    <div class="flex w-[80%] flex-col items-end">
      <template v-if="isEditing">
        <!-- 编辑模式：无 Card 背景，Textarea 带边框自动伸缩（原生 textarea 便于组合式函数直接持有元素） -->
        <textarea
          ref="textareaRef"
          v-model="editText"
          class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          :style="{ overflowY: isScrollable ? 'auto' : 'hidden', height: 'auto' }"
          @keydown="handleEditKeyDown"
        />
        <div class="mt-2 flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            class="size-7"
            :title="t('chat.editCancel') as string"
            @click="handleCancelEdit"
          >
            <X class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-7"
            :disabled="!editText.trim()"
            :title="t('chat.editConfirm') as string"
            @click="handleConfirmEdit"
          >
            <Check class="size-3.5" />
          </Button>
        </div>
      </template>
      <template v-else>
        <!-- 展示模式 -->
        <Card class="border-none bg-gray-100 text-gray-800 shadow-none">
          <StreamingContent class="p-4" :content="currentContent" :is-running="props.isRunning" />
        </Card>
        <!-- 操作栏和翻页器合并到同一行，右对齐 -->
        <div v-if="showActions" class="mt-1 flex items-center gap-1">
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              class="size-7"
              :title="t('chat.copyMessage') as string"
              @click="handleCopy"
            >
              <Copy class="size-3.5" />
            </Button>
            <Button
              v-if="props.isLatestUserMessage && props.onEdit"
              variant="ghost"
              size="icon"
              class="size-7"
              :disabled="props.isChatSending"
              :title="t('chat.editMessage') as string"
              @click="handleStartEdit"
            >
              <Pencil class="size-3.5" />
            </Button>
          </div>
          <Pagination v-if="Array.isArray(props.content) && props.content.length > 1" class="mx-0 mt-1 w-auto">
            <PaginationContent class="gap-1 text-xs text-gray-500 dark:text-gray-400">
              <PaginationItem>
                <PaginationPrevious
                  :disabled="historyIndex === 0 || props.isChatSending"
                  @click="handleHistoryIndexChange(historyIndex - 1)"
                />
              </PaginationItem>
              <PaginationItem>
                <span class="inline-block min-w-8 text-center">
                  {{ historyIndex + 1 }}/{{ props.content.length }}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  :disabled="historyIndex === props.content.length - 1 || props.isChatSending"
                  @click="handleHistoryIndexChange(historyIndex + 1)"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </template>
    </div>
  </div>

  <!-- AI 助手对话气泡 -->
  <div
    v-else-if="props.role === ChatRoleEnum.ASSISTANT"
    class="ml-2 mt-3 flex w-full justify-start"
    data-testid="assistant-message"
    :aria-label="t('common.a11y.assistantMessage') as string"
  >
    <Card class="max-w-[80%] border-none shadow-none">
      <div class="w-full">
        <!-- 推理内容区域 -->
        <ThinkingSection
          v-if="currentReasoning"
          :title="thinkingLoading ? (t('chat.thinking') as string) : (t('chat.thinkingComplete') as string)"
          :content="currentReasoning"
          :loading="thinkingLoading"
        />
        <!-- 正式回复内容 -->
        <StreamingContent
          v-if="currentContent"
          class="mt-2"
          :content="currentContent"
          :is-running="props.isRunning"
        />
        <!-- 操作工具栏（生成中隐藏） -->
        <div v-if="showActions && !props.isRunning" class="mt-1">
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              class="size-7"
              :title="t('chat.copyMessage') as string"
              @click="handleCopy"
            >
              <Copy class="size-3.5" />
            </Button>
            <Button
              v-if="props.isLastAssistant && props.onRegenerate"
              variant="ghost"
              size="icon"
              class="size-7"
              :disabled="props.isChatSending"
              :title="t('chat.regenerateMessage') as string"
              @click="props.onRegenerate!(props.messageId!, historyIndex ?? 0)"
            >
              <RefreshCw class="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
