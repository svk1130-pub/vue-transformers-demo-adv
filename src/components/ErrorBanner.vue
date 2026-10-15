<script setup>
defineProps({ message: { type: String, required: true } })
defineEmits(['dismiss'])
</script>

<template>
  <Transition name="slide-down">
    <div v-if="message" class="error-banner" role="alert">
      <span class="error-banner__icon">!</span>
      <p class="error-banner__message">{{ message }}</p>
      <button class="error-banner__close" @click="$emit('dismiss')" aria-label="Закрыть">×</button>
    </div>
  </Transition>
</template>

<style scoped>
.error-banner { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); color: #991b1b; margin-bottom: 20px; }
.error-banner__icon { width: 24px; height: 24px; border-radius: 50%; background: var(--color-danger); color: #fff; display: grid; place-items: center; font-weight: 700; flex-shrink: 0; }
.error-banner__message { flex: 1; font-size: 14px; line-height: 1.4; }
.error-banner__close { background: none; border: none; font-size: 22px; color: #991b1b; line-height: 1; padding: 2px 6px; border-radius: var(--radius-sm); transition: background-color 0.2s ease; }
.error-banner__close:hover { background: rgba(229, 72, 77, 0.15); }
.slide-down-enter-active, .slide-down-leave-active { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-12px); opacity: 0; }
</style>
