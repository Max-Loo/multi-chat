<script setup lang="ts">
/**
 * 聊天列表中的单个聊天按钮（Vue 版 ChatButton）
 * 支持重命名、确认删除、Shift 悬停快捷删除，行为与 React 版保持一致
 */
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Check, X, Trash2, Edit, MoreHorizontal } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { Input } from '@/components/ui-vue/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui-vue/dropdown-menu';
import { AlertDialog } from '@/components/ui-vue/alert-dialog';
import { useChatStore } from '@/store/pinia/chat';
import { useNavigateToChat } from '@/composables/useNavigateToPage';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { toastQueue } from '@/services/toast';
import { handleActivationKeyDown } from '@/utils/a11y';
import type { ChatMeta } from '@/types/chat';

const props = defineProps<{
  chatMeta: ChatMeta;
  isSelected: boolean;
}>();

const chatStore = useChatStore();
const { t } = useTranslation();
const { layoutMode } = useResponsive();

// Desktop 和 Mobile 模式使用正常尺寸
const isNormalSize = computed(() => layoutMode.value === 'desktop' || layoutMode.value === 'mobile');
const isSending = computed(() => !!chatStore.sendingChatIds[props.chatMeta.id]);

const { navigateToChat, clearChatIdParam } = useNavigateToChat();

// Shift 键按下状态（快捷删除）
const isShiftDown = ref(false);
// 鼠标悬停状态
const isHovering = ref(false);
// 确认删除对话框
const isConfirmOpen = ref(false);

// 全局 keydown/keyup 追踪 Shift 键状态
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Shift') isShiftDown.value = true;
};
const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Shift') isShiftDown.value = false;
};
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
});
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
});

// 点击聊天列表按钮：跳转到对应的聊天详情
const onClickChat = () => {
  navigateToChat({ chatId: props.chatMeta.id });
};

// 快捷删除：跳过确认对话框直接执行删除
const directDelete = async () => {
  try {
    await chatStore.deleteChat({
      chat: { id: props.chatMeta.id, name: props.chatMeta.name } as ChatMeta,
    });
    toastQueue.success(t(($) => $.chat.deleteChatSuccess) as string);
    if (props.isSelected) {
      clearChatIdParam();
    }
  } catch {
    toastQueue.error(t(($) => $.chat.deleteChatFailed) as string);
  }
};

// 删除操作：弹出确认对话框（等价 React 版 modal.warning）
const handleDelete = () => {
  isConfirmOpen.value = true;
};

const handleConfirmDelete = async () => {
  await directDelete();
  isConfirmOpen.value = false;
};

// 重命名状态
const isRenaming = ref(false);
const newName = ref('');

const handleRename = () => {
  isRenaming.value = true;
  newName.value = props.chatMeta.name || '';
};

const onCancelRename = () => {
  isRenaming.value = false;
};

const onConfirmRename = () => {
  // 避免没有意义的编辑
  if (newName.value === props.chatMeta.name) {
    onCancelRename();
    return;
  }

  try {
    void chatStore.editChatName({ id: props.chatMeta.id, name: newName.value });
    toastQueue.success(t(($) => $.chat.editChatSuccess) as string);
    onCancelRename();
  } catch {
    toastQueue.error(t(($) => $.chat.editChatFailed) as string);
  }
};

// 快捷删除按钮是否激活
const isQuickDelete = computed(() => isShiftDown.value && isHovering.value);
</script>

<template>
  <!-- 重命名状态 -->
  <div
    v-if="isRenaming"
    :class="`flex w-full items-center gap-2 px-2 py-2 ${props.isSelected ? 'bg-primary/20' : ''}`"
  >
    <Input
      v-model="newName"
      class="h-8.5 flex-1 text-sm"
      maxlength="20"
    />
    <Button
      variant="default"
      size="sm"
      :disabled="!newName.trim()"
      class="h-8 w-8 shrink-0 p-0"
      @click="onConfirmRename"
    >
      <Check class="h-4 w-4" />
    </Button>
    <Button
      variant="destructive"
      size="sm"
      class="h-8 w-8 shrink-0 p-0 text-white"
      @click="onCancelRename"
    >
      <X class="h-4 w-4" />
    </Button>
  </div>

  <!-- 展示状态 -->
  <div
    v-else
    :data-testid="`chat-button-${props.chatMeta.id}`"
    tabindex="0"
    :aria-selected="props.isSelected"
    :data-variant="isNormalSize ? 'default' : 'compact'"
    :class="`w-full cursor-pointer justify-between rounded-none flex
      ${isNormalSize ? 'py-2 px-1' : 'py-1.5 px-1'}
      ${props.isSelected ? 'bg-primary/20' : 'hover:bg-accent'}`"
    @click="onClickChat"
    @keydown="handleActivationKeyDown(onClickChat)($event)"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <span class="flex min-w-0 flex-1 items-center overflow-hidden pl-2">
      <span
        data-testid="chat-name"
        :class="`truncate ${isNormalSize ? 'text-sm' : 'text-xs'}`"
      >
        {{ props.chatMeta.name || t(($) => $.chat.unnamed) }}
      </span>
    </span>

    <!-- Shift 悬停快捷删除 -->
    <Button
      v-if="isQuickDelete"
      variant="destructive"
      size="icon"
      :aria-label="t(($) => $.chat.shiftDeleteChat) as string"
      :class="`shrink-0 p-0 ${isNormalSize ? 'h-8 w-8' : 'h-7 w-7'}`"
      @click.stop="directDelete"
    >
      <Trash2 :class="`text-white ${isNormalSize ? 'h-4 w-4' : 'h-3.5 w-3.5'}`" />
    </Button>

    <!-- 更多操作菜单 -->
    <DropdownMenu v-else>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          data-testid="chat-menu-trigger"
          :aria-label="t(($) => $.chat.moreActions) as string"
          :class="`p-0 ${isNormalSize ? 'h-8 w-8' : 'h-7 w-7'}`"
          @click.stop
        >
          <MoreHorizontal :class="isNormalSize ? 'h-4 w-4' : 'h-3.5 w-3.5'" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem @select="(e: Event) => { e.stopPropagation(); handleRename(); }">
          <Edit class="mr-2 h-4 w-4" />
          {{ t(($) => $.chat.rename) }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          :disabled="isSending"
          @select="(e: Event) => { e.stopPropagation(); handleDelete(); }"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          {{ t(($) => $.chat.delete) }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- 确认删除对话框 -->
    <AlertDialog :open="isConfirmOpen" @update:open="isConfirmOpen = $event">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <h2 class="text-lg font-semibold">
            {{ t(($) => $.chat.confirmDelete) }}「{{ props.chatMeta.name || t(($) => $.chat.unnamed) }}」
          </h2>
          <p class="text-sm text-muted-foreground">{{ t(($) => $.chat.deleteChatConfirm) }}</p>
        </div>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" @click="isConfirmOpen = false">
            {{ t(($) => $.common.cancel) }}
          </Button>
          <Button variant="destructive" @click="handleConfirmDelete">
            {{ t(($) => $.chat.delete) }}
          </Button>
        </div>
      </div>
    </AlertDialog>
  </div>
</template>
