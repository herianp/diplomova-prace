<template>
  <q-card flat bordered>
    <q-card-section horizontal class="row justify-between items-center">
      <q-card-section class="q-pt-xs">
        <slot name="content" />
      </q-card-section>

      <q-card-section class="col-5 flex flex-center">
        <slot name="media" />
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
