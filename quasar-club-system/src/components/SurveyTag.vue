<template>
  <div :class="tagClass">
    {{ type }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
const props = defineProps({
  type: {
    type: String,
    required: true
  }
});

// Color mapping by type
const tagColors = {
  Training: 'bg-blue-3',
  Match: 'bg-green-3',
  Default: 'bg-grey-3',
}

// Computed class with fallback color
const tagClass = computed(() => {
  const colorClass = tagColors[props.type] || tagColors.Default;
  return `${colorClass} text-grey-8 q-pa-xs q-px-sm rounded-borders text-caption`;
})
</script>
