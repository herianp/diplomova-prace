<template>
  <q-form ref="formRef" @submit.prevent="submitFormHandler" class="q-gutter-md">
    <q-select
      v-model="surveyType"
      :options="surveyTypeOptions"
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

    <q-input
      v-if="isMatchType"
      v-model="opponent"
      :label="$t('survey.form.opponent')"
      :placeholder="$t('survey.form.opponentPlaceholder')"
      outlined
      dense
      type="text"
    >
      <template v-slot:prepend>
        <q-icon name="groups" />
      </template>
    </q-input>

    <q-input
      v-model="description"
      :label="$t('survey.form.description')"
      outlined
      dense
      type="text"
    >
      <template v-slot:prepend>
        <q-icon name="description" />
      </template>
    </q-input>

    <!-- Date Picker -->
    <q-input
      v-model="date"
      :label="$t('survey.form.date')"
      outlined
      dense
      readonly
      :rules="[(val) => !!val || $t('validation.required')]"
    >
      <template v-slot:prepend>
        <q-icon name="event" />
      </template>
      <template #append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date v-model="date" mask="YYYY-MM-DD" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <!-- Time Picker -->
    <q-input
      v-model="time"
      :label="$t('survey.form.time')"
      outlined
      dense
      readonly
      :rules="[(val) => !!val || $t('validation.required')]"
    >
      <template v-slot:prepend>
        <q-icon name="access_time" />
      </template>
      <template #append>
        <q-icon name="access_time" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-time v-model="time" format24h mask="HH:mm" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <q-btn type="submit" :label="$t('common.save')" color="primary" class="q-mt-md" unelevated />
  </q-form>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { SurveyTypes } from '@/enums/SurveyTypes.js'
import { useI18n } from 'vue-i18n'

const i18n = useI18n();

const emit = defineEmits(['submit'])

const formRef = ref(null)
const description = ref('')
const opponent = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const time = ref('19:00')
const surveyType = ref(SurveyTypes.Training)

const isMatchType = computed(() =>
  surveyType.value === SurveyTypes.Match || surveyType.value === SurveyTypes.FriendlyMatch
)

const surveyTypeOptions = computed(() => {
  return Object.values(SurveyTypes).map((type) => ({
    label: i18n.t(`survey.type.${type}`),
    value: type,
  }))
})

function submitFormHandler() {
  emit('submit', {
    description: description.value,
    date: date.value,
    time: time.value,
    surveyType: surveyType.value,
    ...(isMatchType.value && opponent.value ? { opponent: opponent.value } : {}),
  })

  // Reset inputs to defaults
  description.value = ''
  opponent.value = ''
  date.value = new Date().toISOString().slice(0, 10)
  time.value = '19:00'
  surveyType.value = SurveyTypes.Training

  // Clear validation errors
  nextTick(() => { formRef.value?.resetValidation() })
}
</script>
