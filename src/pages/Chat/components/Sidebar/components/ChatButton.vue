<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { Check, X, Trash2, Edit, MoreHorizontal } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ChatMeta } from '@/types/chat';
import { useChatStore } from '@/store/chat';
import { useNavigateToChat } from '@/composables/useNavigateToPage';
import { useConfirm } from '@/composables/useConfirm';
import { useResponsive } from '@/composables/useResponsive';
import { toastQueue } from '@/services/toast';
import { handleActivationKeyDown } from '@/utils/a11y';

/**
 * 聊天列表中的单个聊天按钮属性
 */
interface ChatButtonProps {
  /** 聊天元数据 */
  chatMeta: ChatMeta;
  /** 是否为当前选中聊天 */
  isSelected: boolean;
}

const props = defineProps<ChatButtonProps>();

const chatStore = useChatStore();
const { t } = useTranslation();

const { layoutMode } = useResponsive();
// Desktop 和 Mobile 模式使用正常尺寸
const isNormalSize = computed(
  () => layoutMode.value === 'desktop' || layoutMode.value === 'mobile',
);

const isSending = computed(() => !!chatStore.sendingChatIds[props.chatMeta.id]);

const { navigateToChat, clearChatIdParam } = useNavigateToChat();

// 使用全局确认对话框
const { modal } = useConfirm();

// Shift 键按下状态
const isShiftDown = ref(false);
// 鼠标悬停状态
const isHovering = ref(false);

// 全局 keydown/keyup 追踪 Shift 键状态
/**
 * Shift 按下回调
 */
function onShiftDown(e: KeyboardEvent): void {
  if (e.key === 'Shift') isShiftDown.value = true;
}
/**
 * Shift 松开回调
 */
function onShiftUp(e: KeyboardEvent): void {
  if (e.key === 'Shift') isShiftDown.value = false;
}

onMounted(() => {
  document.addEventListener('keydown', onShiftDown);
  document.addEventListener('keyup', onShiftUp);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onShiftDown);
  document.removeEventListener('keyup', onShiftUp);
});

/** 快捷删除按钮是否激活 */
const isQuickDelete = computed(() => isShiftDown.value && isHovering.value);

/**
 * 点击聊天列表按钮：跳转到对应的聊天详情
 */
function onClickChat(): void {
  navigateToChat({ chatId: props.chatMeta.id });
}

// 是否打开重命名的输入框
const isRenaming = ref(false);
// 临时的重命名
const newName = ref('');

/** 处理重命名操作 */
function handleRename(): void {
  isRenaming.value = true;
  newName.value = props.chatMeta.name || '';
}

/** 执行删除（供确认对话框与快捷删除共用） */
async function performDelete(): Promise<void> {
  try {
    await chatStore.deleteChat({
      // 从 activeChatData 获取完整聊天数据用于存储层标记 isDeleted
      chat: {
        id: props.chatMeta.id,
        name: props.chatMeta.name,
      } as never,
    });
    toastQueue.success(t('chat.deleteChatSuccess'));

    // 如果删除的是当前选中的聊天，清除 URL 中的 chatId 参数
    if (props.isSelected) {
      clearChatIdParam();
    }
  } catch {
    toastQueue.error(t('chat.deleteChatFailed'));
  }
}

/** 处理删除操作（带确认对话框） */
function handleDelete(): void {
  modal.warning({
    title: `${t('chat.confirmDelete')}「${props.chatMeta.name || t('chat.unnamed')}」`,
    description: t('chat.deleteChatConfirm'),
    onOk: performDelete,
  });
}

/** 快捷删除：跳过确认对话框直接执行删除 */
function directDelete(): void {
  void performDelete();
}

/** 取消重命名 */
function onCancelRename(): void {
  isRenaming.value = false;
}

/** 确认重命名 */
function onConfirmRename(): void {
  // 避免没有意义的编辑
  if (newName.value === props.chatMeta.name) {
    onCancelRename();
    return;
  }

  chatStore
    .editChatName({
      id: props.chatMeta.id,
      name: newName.value,
    })
    .then(() => {
      toastQueue.success(t('chat.editChatSuccess'));
      onCancelRename();
    })
    .catch(() => {
      toastQueue.error(t('chat.editChatFailed'));
    });
}
</script>

<!-- 聊天列表中的单个聊天按钮 -->
<template>
  <!-- 重命名状态：输入框 + 确认/取消 -->
  <div
    v-if="isRenaming"
    :class="[
      'flex items-center gap-2 w-full px-2 py-2',
      props.isSelected && 'bg-primary/20',
    ]"
  >
    <Input
      v-model="newName"
      class="flex-1 h-8.5 text-sm"
      autofocus
      maxlength="20"
    />
    <Button
      variant="default"
      size="sm"
      :disabled="!newName.trim()"
      class="h-8 w-8 p-0 shrink-0"
      :aria-label="t('common.confirm')"
      @click="onConfirmRename"
    >
      <Check class="h-4 w-4" />
    </Button>
    <Button
      variant="destructive"
      size="sm"
      class="h-8 w-8 p-0 shrink-0 text-white"
      :aria-label="t('common.cancel')"
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
    :class="[
      'w-full flex justify-between rounded-none cursor-pointer',
      isNormalSize ? 'py-2 px-1' : 'py-1.5 px-1',
      props.isSelected ? 'bg-primary/20' : 'hover:bg-accent',
    ]"
    @click="onClickChat"
    @keydown="handleActivationKeyDown(onClickChat)($event)"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <span class="flex items-center flex-1 overflow-hidden min-w-0 pl-2">
      <span
        data-testid="chat-name"
        :class="['truncate', isNormalSize ? 'text-sm' : 'text-xs']"
      >
        {{ props.chatMeta.name || t('chat.unnamed') }}
      </span>
    </span>

    <!-- 快捷删除（Shift + 悬停） -->
    <Button
      v-if="isQuickDelete"
      variant="destructive"
      size="icon"
      :aria-label="t('chat.shiftDeleteChat')"
      :class="['p-0 shrink-0', isNormalSize ? 'h-8 w-8' : 'h-7 w-7']"
      @click.stop="directDelete"
    >
      <Trash2 :class="['text-white', isNormalSize ? 'h-4 w-4' : 'h-3.5 w-3.5']" />
    </Button>

    <!-- 常规操作菜单 -->
    <DropdownMenu v-else>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          data-testid="chat-menu-trigger"
          :aria-label="t('chat.moreActions')"
          :class="['p-0', isNormalSize ? 'h-8 w-8' : 'h-7 w-7']"
          @click.stop
        >
          <MoreHorizontal :class="isNormalSize ? 'h-4 w-4' : 'h-3.5 w-3.5'" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          @click.stop="
            () => {
              handleRename();
            }
          "
        >
          <Edit class="mr-2 h-4 w-4" />
          {{ t('chat.rename') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          :disabled="isSending"
          @click.stop="
            () => {
              handleDelete();
            }
          "
        >
          <Trash2 class="mr-2 h-4 w-4" />
          {{ t('chat.delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
