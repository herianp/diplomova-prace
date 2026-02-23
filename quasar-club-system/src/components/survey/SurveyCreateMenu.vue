<template>
  <div class="survey-create-menu" v-if="isPowerUser">
    <q-expansion-item
      v-model="expanded"
      icon="add_circle"
      :label="$t('survey.create')"
      :header-class="'bg-positive text-white'"
      class="create-expansion"
    >
      <q-card flat class="create-card">
        <q-card-section class="q-pa-md">
          <div class="create-description q-mb-md">
            <q-icon name="info" color="primary" size="sm" class="q-mr-sm" />
            <span class="text-grey-7">{{ $t('survey.createMenu.description') }}</span>
          </div>
          
          <!-- Survey Form -->
          <SurveyForm 
            @submit="handleSurveySubmit" 
            @cancel="handleCancel"
            :loading="isSubmitting"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SurveyForm from '@/components/modal/SurveyForm.vue'
import { createLogger } from 'src/utils/logger'

const log = createLogger('SurveyCreateMenu')

// Props
defineProps({
  isPowerUser: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['survey-created'])

// State
const expanded = ref(false)
const isSubmitting = ref(false)

// Methods
const handleSurveySubmit = async (payload) => {
  try {
    isSubmitting.value = true
    emit('survey-created', payload)
    // Close expansion after successful creation
    expanded.value = false
  } catch (error) {
    log.error('Failed to create survey', {
      error: error instanceof Error ? error.message : String(error)
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  expanded.value = false
}
</script>

<style scoped>
.survey-create-menu {
  margin-bottom: 1rem;
}

.create-expansion {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.create-card {
  background: #f9f9f9;
}

.create-description {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: rgba(25, 118, 210, 0.1);
  border-radius: 4px;
  font-size: 0.875rem;
}

/* Match filter menu styling */
.survey-create-menu .q-expansion-item__header {
  padding: 12px 16px;
}

.survey-create-menu .q-expansion-item__content {
  padding: 0;
}

@media (max-width: 768px) {
  .create-description {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>