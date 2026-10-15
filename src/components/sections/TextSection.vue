<script setup>
defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <section class="text-section">
    <h2 class="text-section__title">{{ section.title }}</h2>
    <p
      v-for="(paragraph, index) in section.body"
      :key="index"
      class="text-section__p"
    >
      {{ paragraph }}
    </p>
  </section>
</template>

<style scoped>
.text-section__title { font-size: 20px; font-weight: 600; color: var(--color-text); margin-bottom: 12px; }
.text-section__p { font-size: 15px; line-height: 1.6; color: var(--color-text-muted); margin-bottom: 12px; }
</style>
