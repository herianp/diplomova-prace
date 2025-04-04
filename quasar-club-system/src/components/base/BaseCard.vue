<template>
  <q-card class="my-card" flat bordered>
    <q-card-section horizontal class="row justify-between items-center">
      <slot name="header" />
      <slot name="media" />
    </q-card-section>

    <q-separator />

    <q-card-actions
      v-if="hasActionsSlot"
      class="q-px-md q-pb-sm"
      style="display: flex; justify-content: space-between"
    >
      <slot name="actions" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { useSlots } from 'vue'

const slots = useSlots()
const hasActionsSlot = !!slots.actions
</script>
