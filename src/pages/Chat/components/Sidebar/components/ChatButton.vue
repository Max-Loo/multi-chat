<script setup lang="ts">
/**
 * 聊天列表中的单个聊天按钮（对应旧版 ChatButton.tsx）
 * 支持重命名、删除（Shift 悬停快捷删除）与更多操作菜单
 */
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/stores';
import { useNavigateToChat } from '@/composables/useNavigateToPage';
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
import { useTranslation } from '@/composables/useTranslation';
import { toastQueue } from '@/services/toast';
import { useConfirm } from '@/composables/useConfirm';
import { useResponsive } from '@/composables/useResponsive';
import { handleActivationKeyDown } from '@/utils/a11y';
import type { ChatMeta } from '@/types/chat';

/** 组件属性 */
interface Props {
  chatMeta: ChatMeta;
  isSelected: boolean;
}

const props = defineProps<Props>();

const chatStore = useChatStore();
const { sendingChatIds } = storeToRefs(chatStore);
const { t } = useTranslation();
const { layoutMode } = useResponsive();

// Desktop 和 Mobile 模式使用正常尺寸
const isNormalSize = ref(
  layoutMode.value === 'desktop' || layoutMode.value === 'mobile',
);

const isSending = ref(Boolean(sendingChatIds.value[props.chatMeta.id]));

const { navigateToChat, clearChatIdParam } = useNavigateToChat();
const { modal } = useConfirm();

// Shift 键按下状态
const isShiftDown = ref(false);
// 鼠标悬停状态
const isHovering = ref(false);

// 响应式尺寸与发送状态跟踪
watch(
  () => [layoutMode.value, sendingChatIds.value[props.chatMeta.id]] as const,
  ([mode, sending]) => {
    isNormalSize.value = mode === 'desktop' || mode === 'mobile';
    isSending.value = Boolean(sending);
  },
);

// 全局 keydown/keyup 追踪 Shift 键状态
const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === 'Shift') isShiftDown.value = true;
};
const handleKeyUp = (e: KeyboardEvent): void => {
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

/** 点击聊天列表按钮 */
const onClickChat = (meta: ChatMeta): void => {
  // 跳转到对应的聊天详情
  navigateToChat({ chatId: meta.id });
};

// 是否打开重命名的输入框
const isRenaming = ref(false);
// 临时的重命名
const newName = ref('');

/** 处理重命名操作 */
const handleRename = (): void => {
  isRenaming.value = true;
  newName.value = props.chatMeta.name || '';
};

/** 执行删除（供确认回调与快捷删除复用） */
const performDelete = async (): Promise<void> => {
  try {
    await chatStore.deleteChat({
      // 从 activeChatData 获取完整聊天数据用于存储层标记 isDeleted
      id: props.chatMeta.id,
      name: props.chatMeta.name,
    } as Parameters<typeof chatStore.deleteChat>[0]);
    void toastQueue.success(t('chat.deleteChatSuccess'));

    // 如果删除的是当前选中的聊天，清除 URL 中的 chatId 参数
    if (props.isSelected) {
      clearChatIdParam();
    }
  } catch {
    void toastQueue.error(t('chat.deleteChatFailed'));
  }
};

/** 处理删除操作（带确认对话框） */
const handleDelete = (): void => {
  modal.warning({
    title: `${t('chat.confirmDelete')}「${props.chatMeta.name || t('chat.unnamed')}」`,
    description: t('chat.deleteChatConfirm'),
    onOk: () => void performDelete(),
  });
};

/** 取消重命名 */
const onCancelRename = (): void => {
  isRenaming.value = false;
};

/** 确认重命名 */
const onConfirmRename = (): void => {
  // 避免没有意义的编辑
  if (newName.value === props.chatMeta.name) {
    onCancelRename();
    return;
  }

  try {
    chatStore.editChatName(props.chatMeta.id, newName.value);

    void toastQueue.success(t('chat.editChatSuccess'));
    onCancelRename();
  } catch {
    void toastQueue.error(t('chat.editChatFailed'));
  }
};

// 快捷删除按钮是否激活
const isQuickDelete = computed(
  () => isShiftDown.value && isHovering.value,
);

/** 快捷键激活回调 */
const activationKeydown = handleActivationKeyDown(() =>
  onClickChat(props.chatMeta),
);
</script>

<template>
  <!-- 重命名态 -->
  <div
    v-if="isRenaming"
    :class="`flex w-full items-center gap-2 px-2 py-2 ${props.isSelected && 'bg-primary/20'}`"
  >
    <Input
      v-model="newName"
      class="h-8.5 flex-1 text-sm"
      autofocus
      :maxlength="20"
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

  <!-- 展示态 -->
  <div
    v-else
    :data-testid="`chat-button-${props.chatMeta.id}`"
    :tabindex="0"
    :aria-selected="props.isSelected"
    :data-variant="isNormalSize ? 'default' : 'compact'"
    :class="`w-full cursor-pointer justify-between rounded-none flex
      ${isNormalSize ? 'py-2 px-1' : 'py-1.5 px-1'}
      ${props.isSelected ? 'bg-primary/20' : 'hover:bg-accent'}
    `"
    @click="onClickChat(props.chatMeta)"
    @keydown="activationKeydown"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <span class="flex min-w-0 flex-1 items-center overflow-hidden pl-2">
      <span
        data-testid="chat-name"
        :class="`truncate ${isNormalSize ? 'text-sm' : 'text-xs'}`"
      >
        {{ props.chatMeta.name || t('chat.unnamed') }}
      </span>
    </span>
    <!-- 快捷删除 -->
    <Button
      v-if="isQuickDelete"
      variant="destructive"
      size="icon"
      :aria-label="t('chat.shiftDeleteChat')"
      :class="`shrink-0 p-0 ${isNormalSize ? 'h-8 w-8' : 'h-7 w-7'}`"
      @click.stop="performDelete"
    >
      <Trash2 :class="`text-white ${isNormalSize ? 'h-4 w-4' : 'h-3.5 w-3.5'}`" />
    </Button>
    <!-- 更多操作菜单 -->
    <DropdownMenu v-else>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          data-testid="chat-menu-trigger"
          :aria-label="t('chat.moreActions')"
          :class="`p-0 ${isNormalSize ? 'h-8 w-8' : 'h-7 w-7'}`"
          @click.stop
        >
          <MoreHorizontal :class="isNormalSize ? 'h-4 w-4' : 'h-3.5 w-3.5'" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem @click.stop="handleRename">
          <Edit class="mr-2 h-4 w-4" />
          {{ t('chat.rename') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          :disabled="isSending"
          @click.stop="handleDelete"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          {{ t('chat.delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
