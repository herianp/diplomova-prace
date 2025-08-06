<template>
  <div class="page-header q-mb-xl">
    <div class="row items-center justify-between">
      <div class="col">
        <h2 class="text-h4 q-ma-none text-white">
          {{ title }}
        </h2>
        <div v-if="surveyTitle" class="text-h5 text-white text-weight-medium q-mt-sm">
          {{ surveyTitle }}
        </div>
        <div class="text-body1 text-white q-mt-xs opacity-90">
          {{ description }}
        </div>
      </div>
      <div v-if="goBackOption" class="col-auto">
        <q-btn
          color="white"
          text-color="orange"
          icon="arrow_back"
          :label="$t('common.back')"
          @click="$emit('goBack')"
          unelevated
        />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  surveyTitle: String,
  description: String,
  goBackOption: {
    type: Boolean,
    default: false,
  },
})
defineEmits(['goBack'])
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, #ff6f00 0%, #ff8f00 50%, #ffa000 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(255, 111, 0, 0.3);
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
  }
}
</style>
