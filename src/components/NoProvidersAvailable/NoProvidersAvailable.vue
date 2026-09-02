<script setup lang="ts">
import { AlertCircle } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { useT } from "@/composables/useT"

/**
 * 处理重新加载页面
 */
const handleReload = () => {
  window.location.reload()
}

const t = useT()
</script>

<template>
  <div
    data-testid="no-providers-container"
    class="fixed inset-0 flex items-center justify-center bg-background"
    role="alert"
  >
    <div
      data-testid="no-providers-content"
      class="flex max-w-md flex-col items-center gap-6 text-center p-6"
    >
      <AlertCircle
        data-testid="no-providers-icon"
        class="h-16 w-16 text-destructive"
        role="img"
        :aria-label="t(($) => $.common.errorIcon)"
      />

      <div class="space-y-2">
        <h2 class="text-2xl font-semibold">
          {{ t(($) => $.common.noProvidersAvailable) }}
        </h2>
        <p class="text-muted-foreground">
          {{ t(($) => $.common.noProvidersDescription) }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ t(($) => $.common.noProvidersHint) }}
        </p>
      </div>

      <Button size="lg" @click="handleReload">
        {{ t(($) => $.common.reload) }}
      </Button>
    </div>
  </div>
</template>
