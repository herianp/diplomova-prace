<template>
  <div class="date-separator q-my-md">
    <div class="date-separator-line"></div>
    <q-chip
      dense
      size="sm"
      color="grey-3"
      text-color="grey-7"
      class="date-separator-chip"
    >
      {{ date }}
    </q-chip>
    <div class="date-separator-line"></div>
  </div>
</template>

<script setup>
defineProps({
  date: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.date-separator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-separator-line {
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.date-separator-chip {
  flex-shrink: 0;
}
</style>
