<script setup>
defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <section class="list-section">
    <h2 class="list-section__title">{{ section.title }}</h2>
    <ul class="list-section__ul">
      <li
        v-for="(item, index) in section.items"
        :key="index"
        class="list-section__li"
      >
        {{ item }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.list-section__title { font-size: 20px; font-weight: 600; color: var(--color-text); margin-bottom: 12px; }
.list-section__ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.list-section__li { position: relative; padding-left: 24px; font-size: 15px; line-height: 1.55; color: var(--color-text-muted); }
.list-section__li::before { content: '▸'; position: absolute; left: 0; top: 0; color: var(--color-primary); font-weight: 700; }
</style>
