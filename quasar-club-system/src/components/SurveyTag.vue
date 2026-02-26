<template>
  <div :class="tagClass">
    {{ displayLabel }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props
const props = defineProps({
  type: {
    type: String,
    required: true
  },
  opponent: {
    type: String,
    default: ''
  }
});

const displayLabel = computed(() => {
  const typeLabel = t(`survey.type.${props.type}`)
  if ((props.type === 'match' || props.type === 'friendly-match') && props.opponent) {
    return `${typeLabel} (${props.opponent})`
  }
  return typeLabel
})

// Color mapping by type (using lowercase keys to match enum values)
const tagColors = {
  training: 'bg-blue-3',
  match: 'bg-green-3',
  'friendly-match': 'bg-orange-3',
  default: 'bg-grey-3',
}

// Computed class with fallback color
const tagClass = computed(() => {
  const colorClass = tagColors[props.type] || tagColors.default;
  return `${colorClass} text-grey-8 q-pa-xs q-px-sm rounded-borders text-caption`;
})
</script>
