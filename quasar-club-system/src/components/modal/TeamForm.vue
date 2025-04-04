<template>
  <q-form @submit.prevent="submitFormHandler" class="q-gutter-md">
    <q-input
      v-model="title"
      label="Title"
      filled
      dense
      lazy-rules
      :rules="[(val) => !!val || 'Title is required']"
    />

    <q-btn type="submit" label="Submit" color="primary" class="q-mt-md" unelevated />
  </q-form>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])

const title = ref('')

function submitFormHandler() {
  emit('submit', {
    title: title.value
  });

  title.value = ''
}
</script>
