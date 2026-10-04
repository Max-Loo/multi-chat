<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { Copy, Pencil, RefreshCw, Check, X, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatRoleEnum } from '@/types/chat';
import ThinkingSection from './ThinkingSection.vue';
import StreamingContent from './StreamingContent.vue';
import {
  getCurrentContent,
  getContentAtIndex,
} from '@/services/chat/chatHistoryHelper';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';

/**
 * 聊天气泡组件的属性接口
 */
interface ChatBubbleProps {
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

const props = withDefaults(defineProps<ChatBubbleProps>(), {
  isRunning: false,
  reasoningContent: undefined,
  messageId: undefined,
  isLatestUserMessage: undefined,
  isLastAssistant: undefined,
  onCopy: undefined,
  onEdit: undefined,
  onRegenerate: undefined,
  isChatSending: undefined,
  historyIndexOverride: undefined,
  onHistoryIndexChange: undefined,
});

const { t } = useTranslation();

/** 是否处于编辑模式 */
const isEditing = ref(false);
/** 编辑中的文本 */
const editText = ref('');
/** 内部历史索引（外部 override 缺省时生效） */
const internalHistoryIndex = ref(
  Array.isArray(props.content) ? props.content.length - 1 : 0,
);

const { textareaRef, isScrollable } = useAutoResizeTextarea(editText, {
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

// 使用外部索引（成对同步）或内部索引
const historyIndex = computed(() =>
  props.historyIndexOverride !== undefined
    ? props.historyIndexOverride
    : internalHistoryIndex.value,
);

/** 当前版本的内容 */
const currentContent = computed(() =>
  getContentAtIndex(props.content, historyIndex.value),
);

/** 当前版本的推理内容 */
const currentReasoning = computed(() => {
  if (!props.reasoningContent) return undefined;
  return getContentAtIndex(props.reasoningContent, historyIndex.value);
});

// content 外部更新（编辑确认推送新版本）时，重置内部索引到最新
watch(
  () => props.content,
  (content) => {
    if (Array.isArray(content)) {
      internalHistoryIndex.value = content.length - 1;
      if (props.historyIndexOverride === undefined) {
        props.onHistoryIndexChange?.(content.length - 1);
      }
    }
  },
);

/** 推理内容的加载状态（生成中且尚无正式内容） */
const thinkingLoading = computed(() => props.isRunning && !currentContent.value);

/** 是否显示操作栏（有消息 ID 即显示，发送期间通过 disabled 禁用） */
const showActions = computed(() => !!props.messageId);

/** 进入编辑模式 */
function handleStartEdit(): void {
  editText.value = getCurrentContent(props.content);
  isEditing.value = true;
  // 延迟聚焦以确保 DOM 已更新
  setTimeout(() => {
    textareaRef.value?.focus();
    textareaRef.value?.setSelectionRange(
      textareaRef.value.value.length,
      textareaRef.value.value.length,
    );
  }, 0);
}

/** 确认编辑 */
function handleConfirmEdit(): void {
  const trimmed = editText.value.trim();
  if (!trimmed) return;
  if (props.messageId && props.onEdit) {
    props.onEdit(props.messageId, trimmed);
  }
  isEditing.value = false;
}

/** 取消编辑 */
function handleCancelEdit(): void {
  isEditing.value = false;
  editText.value = '';
}

/**
 * 编辑模式的键盘事件（Enter 确认、Esc 取消）
 * @param e 键盘事件
 */
function handleEditKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleConfirmEdit();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    handleCancelEdit();
  }
}

/**
 * 翻页回调：同步更新内部状态并通知父组件
 * @param index 目标历史索引
 */
function handleHistoryIndexChange(index: number): void {
  internalHistoryIndex.value = index;
  props.onHistoryIndexChange?.(index);
}

/** 编辑历史总版本数 */
const historyTotal = computed(() =>
  Array.isArray(props.content) ? props.content.length : 1,
);

/** 复制按钮点击 */
function handleCopyClick(): void {
  if (props.messageId && props.onCopy) props.onCopy(props.messageId);
}

/** 重新生成按钮点击 */
function handleRegenerateClick(): void {
  props.onRegenerate?.(props.messageId!, historyIndex.value);
}
</script>

<!--
  聊天气泡组件
  显示用户和 AI 助手的聊天气泡，支持 Markdown 渲染、操作工具栏、行内编辑和历史翻页
-->
<template>
  <!-- 用户对话气泡 -->
  <div
    v-if="props.role === ChatRoleEnum.USER"
    class="flex justify-end w-full mt-3 mr-2"
    data-testid="user-message"
    :aria-label="t('common.a11y.userMessage')"
  >
    <div class="flex flex-col items-end w-[80%]">
      <!-- 编辑模式 -->
      <template v-if="isEditing">
        <Textarea
          :ref="setTextareaRef"
          v-model="editText"
          class="resize-none"
          :style="{ overflowY: isScrollable ? 'auto' : 'hidden' }"
          @keydown="handleEditKeyDown"
        />
        <div class="flex items-center gap-1 mt-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            class="size-7"
            :title="t('chat.editCancel')"
            :aria-label="t('chat.editCancel')"
            @click="handleCancelEdit"
          >
            <X class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-7"
            :disabled="!editText.trim()"
            :aria-label="t('chat.editConfirm')"
            @click="handleConfirmEdit"
          >
            <Check class="size-3.5" />
          </Button>
        </div>
      </template>

      <!-- 展示模式 -->
      <template v-else>
        <Card class="bg-gray-100 text-gray-800 border-none shadow-none">
          <StreamingContent
            class="p-4"
            :content="currentContent"
            :is-running="props.isRunning"
          />
        </Card>

        <!-- 操作栏和翻页器合并到同一行，右对齐 -->
        <div v-if="showActions" class="flex items-center gap-1 mt-1">
          <template v-if="props.messageId">
            <!-- 复制按钮 -->
            <Button
              variant="ghost"
              size="icon"
              class="size-7"
              :title="t('chat.copyMessage')"
              @click="handleCopyClick"
            >
              <Copy class="size-3.5" />
            </Button>

            <!-- 编辑按钮 — 仅最新用户消息 -->
            <Button
              v-if="props.isLatestUserMessage && props.onEdit"
              variant="ghost"
              size="icon"
              class="size-7"
              :disabled="props.isChatSending"
              :title="t('chat.editMessage')"
              @click="handleStartEdit"
            >
              <Pencil class="size-3.5" />
            </Button>
          </template>

          <!-- 编辑历史翻页器 -->
          <template v-if="historyTotal > 1">
            <Button
              variant="ghost"
              size="icon"
              class="size-7"
              :disabled="historyIndex === 0 || props.isChatSending"
              :aria-label="t('chat.previousVersion')"
              @click="handleHistoryIndexChange(historyIndex - 1)"
            >
              <ChevronLeft class="size-3.5" />
            </Button>
            <span class="min-w-8 text-center inline-block text-xs text-gray-500 dark:text-gray-400">
              {{ historyIndex + 1 }}/{{ historyTotal }}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="size-7"
              :disabled="historyIndex === historyTotal - 1 || props.isChatSending"
              :aria-label="t('chat.nextVersion')"
              @click="handleHistoryIndexChange(historyIndex + 1)"
            >
              <ChevronRight class="size-3.5" />
            </Button>
          </template>
        </div>
      </template>
    </div>
  </div>

  <!-- AI 助手对话气泡 -->
  <div
    v-else-if="props.role === ChatRoleEnum.ASSISTANT"
    class="flex justify-start w-full mt-3 ml-2"
    data-testid="assistant-message"
    :aria-label="t('common.a11y.assistantMessage')"
  >
    <Card class="border-none shadow-none max-w-[80%]">
      <div class="w-full">
        <!-- 推理内容区域 -->
        <ThinkingSection
          v-if="currentReasoning"
          :title="
            thinkingLoading
              ? t('chat.thinking')
              : t('chat.thinkingComplete')
          "
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
          <template v-if="props.messageId">
            <!-- 复制按钮 -->
            <Button
              variant="ghost"
              size="icon"
              class="size-7"
              :title="t('chat.copyMessage')"
              @click="handleCopyClick"
            >
              <Copy class="size-3.5" />
            </Button>

            <!-- 重新生成按钮 — 仅最后一条 AI 回复 -->
            <Button
              v-if="props.isLastAssistant && props.onRegenerate"
              variant="ghost"
              size="icon"
              class="size-7"
              :disabled="props.isChatSending"
              :title="t('chat.regenerateMessage')"
              @click="handleRegenerateClick"
            >
              <RefreshCw class="size-3.5" />
            </Button>

            <!-- 编辑历史翻页器 -->
            <template v-if="historyTotal > 1">
              <Button
                variant="ghost"
                size="icon"
                class="size-7"
                :disabled="historyIndex === 0 || props.isChatSending"
                :aria-label="t('chat.previousVersion')"
                @click="handleHistoryIndexChange(historyIndex - 1)"
              >
                <ChevronLeft class="size-3.5" />
              </Button>
              <span class="min-w-8 text-center inline-block text-xs text-gray-500 dark:text-gray-400">
                {{ historyIndex + 1 }}/{{ historyTotal }}
              </span>
              <Button
                variant="ghost"
                size="icon"
                class="size-7"
                :disabled="historyIndex === historyTotal - 1 || props.isChatSending"
                :aria-label="t('chat.nextVersion')"
                @click="handleHistoryIndexChange(historyIndex + 1)"
              >
                <ChevronRight class="size-3.5" />
              </Button>
            </template>
          </template>
        </div>
      </div>
    </Card>
  </div>
</template>
