<template>
  <q-form @submit.prevent="handleUpdate" class="q-gutter-md">
    <!-- Title Field -->
    <q-input
      v-model="formData.title"
      :label="$t('survey.form.title')"
      :rules="[val => val && val.length > 0 || $t('validation.required')]"
      outlined
      dense
    >
      <template v-slot:prepend>
        <q-icon name="title" />
      </template>
    </q-input>

    <!-- Description Field -->
    <q-input
      v-model="formData.description"
      :label="$t('survey.form.description')"
      :rules="[val => val && val.length > 0 || $t('validation.required')]"
      outlined
      dense
      type="textarea"
      rows="3"
    >
      <template v-slot:prepend>
        <q-icon name="description" />
      </template>
    </q-input>

    <!-- Date Field -->
    <q-input
      v-model="formData.date"
      :label="$t('survey.form.date')"
      :rules="[val => (val && val.length > 0) || $t('validation.required')]"
      outlined
      dense
      type="date"
    >
      <template v-slot:prepend>
        <q-icon name="event" />
      </template>
    </q-input>

    <!-- Time Field -->
    <q-input
      v-model="formData.time"
      :label="$t('survey.form.time')"
      :rules="[val => (val && val.length > 0) || $t('validation.required')]"
      outlined
      dense
      type="time"
    >
      <template v-slot:prepend>
        <q-icon name="access_time" />
      </template>
    </q-input>

    <!-- Survey Type Selection -->
    <q-select
      v-model="formData.type"
      :options="typeOptions"
      :label="$t('survey.form.type')"
      outlined
      dense
      emit-value
      map-options
    >
      <template v-slot:prepend>
        <q-icon name="category" />
      </template>
    </q-select>

    <!-- Error Message -->
    <div v-if="error" class="text-negative q-mt-md">
      <q-icon name="error" class="q-mr-sm" />
      {{ error }}
    </div>

    <!-- Action Buttons -->
    <div class="row q-gutter-sm q-mt-lg">
      <!-- Update Button -->
      <q-btn
        type="submit"
        color="primary"
        icon="save"
        :label="$t('common.update')"
        :loading="updating"
        unelevated
      />

      <!-- Delete Button -->
      <q-btn
        v-if="!showDeleteConfirm"
        color="negative"
        icon="delete"
        :label="$t('common.delete')"
        @click="showDeleteConfirm = true"
        outline
      />

      <!-- Delete Confirmation -->
      <q-btn
        v-if="showDeleteConfirm"
        color="negative"
        icon="delete_forever"
        :label="$t('survey.confirmDelete')"
        @click="handleDelete"
        :loading="deleting"
        unelevated
      />

      <!-- Cancel Delete -->
      <q-btn
        v-if="showDeleteConfirm"
        color="grey"
        icon="cancel"
        :label="$t('common.cancel')"
        @click="showDeleteConfirm = false"
        flat
      />
    </div>
  </q-form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import { SurveyTypes } from '@/enums/SurveyTypes'
import { createLogger } from 'src/utils/logger'

const log = createLogger('SurveyEditModal')

const props = defineProps({
  survey: {
    type: Object,
    required: true
  }
})

const emits = defineEmits(['updated', 'deleted', 'close'])

const { t } = useI18n()
const $q = useQuasar()
const { updateSurvey, deleteSurvey } = useSurveyUseCases()

// Form state
const formData = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  type: SurveyTypes.Match
})

const error = ref('')
const updating = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

// Survey type options - derived from enum (single source of truth)
const typeOptions = computed(() => {
  return Object.values(SurveyTypes).map((type) => ({
    label: t(`survey.type.${type}`),
    value: type,
  }))
})

// Initialize form with survey data
const initializeForm = () => {
  formData.value = {
    title: props.survey.title || '',
    description: props.survey.description || '',
    date: props.survey.date || '',
    time: props.survey.time || '',
    type: props.survey.type || SurveyTypes.Match
  }
}

// Handle survey update
const handleUpdate = async () => {
  if (updating.value) return
  
  error.value = ''
  updating.value = true
  
  try {
    await updateSurvey(props.survey.id, {
      title: formData.value.title,
      description: formData.value.description,
      date: formData.value.date,
      time: formData.value.time,
      type: formData.value.type
    }, {
      teamId: props.survey.teamId,
      before: {
        title: props.survey.title,
        description: props.survey.description,
        date: props.survey.date,
        time: props.survey.time,
        type: props.survey.type
      }
    })
    
    $q.notify({
      type: 'positive',
      message: t('survey.updateSuccess'),
      icon: 'check_circle'
    })
    
    emits('updated')
    emits('close')

  } catch (err) {
    log.error('Failed to update survey', {
      error: err instanceof Error ? err.message : String(err),
      surveyId: props.survey.id,
      title: formData.value.title
    })
    error.value = t('survey.updateError')
    
    $q.notify({
      type: 'negative',
      message: t('survey.updateError'),
      icon: 'error'
    })
  } finally {
    updating.value = false
  }
}

// Handle survey deletion
const handleDelete = async () => {
  if (deleting.value) return
  
  deleting.value = true
  error.value = ''
  
  try {
    await deleteSurvey(props.survey.id)
    
    $q.notify({
      type: 'positive',
      message: t('survey.deleteSuccess'),
      icon: 'check_circle'
    })
    
    emits('deleted')
    emits('close')

  } catch (err) {
    log.error('Failed to delete survey', {
      error: err instanceof Error ? err.message : String(err),
      surveyId: props.survey.id
    })
    error.value = t('survey.deleteError')
    
    $q.notify({
      type: 'negative',
      message: t('survey.deleteError'),
      icon: 'error'
    })
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

onMounted(() => {
  initializeForm()
})
</script>

<style scoped>
.q-form {
  min-width: 400px;
}

@media (max-width: 600px) {
  .q-form {
    min-width: 300px;
  }
}
</style>