<template>
  <q-card flat bordered class="bg-grey-3">
    <q-card-section horizontal class="row justify-between items-center">
      <q-card-section style="min-width: 100%">
        <slot name="content" />
      </q-card-section>
    </q-card-section>

    <q-separator v-if="$slots.actions" />

    <q-card-actions v-if="$slots.actions" style="display: flex; justify-content: space-between">
      <slot name="actions" />
    </q-card-actions>
  </q-card>
</template>

<script setup>

</script>

<style scoped>
</style>
