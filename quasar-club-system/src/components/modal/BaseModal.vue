<template>
  <q-dialog v-model="model" :backdrop-filter="backdropFilter">
    <q-card>
      <q-card-section class="row items-center q-pb-none text-h6">
        {{ title }}
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <slot name="body"> This dialog has a backdrop filter of {{ backdropFilter }}. </slot>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const model = defineModel()

defineProps({
  title: {
    type: String,
    default: '',
  },
})

defineEmits(['update:modelValue'])

onMounted(() => {
  console.log(`model ${JSON.stringify(model.value)}`)
})

const backdropFilter = ref('contrast(40%)')
</script>
