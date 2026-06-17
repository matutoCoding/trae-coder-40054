<script setup lang="ts">
import { watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  title: string
  width?: string
  closeOnClickOverlay?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay !== false) {
    handleClose()
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleOverlayClick"
        ></div>
        <div
          class="relative bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col transform transition-all"
          :style="{ width: width || '520px' }"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 class="text-lg font-semibold text-slate-800">{{ title }}</h3>
            <button
              class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              @click="handleClose"
            >
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-6">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(-20px);
  opacity: 0;
}
</style>
