<script setup lang="ts">
// Server-rendered timestamp so we can prove SSR ran rather than a hydration-only client paint.
const renderedAt = new Date().toISOString();
</script>

<template>
  <main>
    <h1 data-testid="hero">Hello from @solcreek/nitro/creekd</h1>
    <p data-testid="rendered-at">{{ renderedAt }}</p>
  </main>
</template>
