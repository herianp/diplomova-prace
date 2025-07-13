<template>
  <q-form @submit.prevent="submitFormHandler" class="q-gutter-md">
    <q-select
      filled
      dense
      v-model="surveyType"
      :options="surveyTypeOptions"
      style="width: 250px"
    />

    <q-input
      v-model="title"
      label="Title"
      filled
      dense
      lazy-rules
      :rules="[(val) => !!val || 'Title is required']"
    />

    <q-input v-model="description" label="Description" filled dense type="text" />

    <!-- ✅ Date Picker -->
    <q-input
      v-model="date"
      label="Select date"
      filled
      dense
      readonly
      :rules="[(val) => !!val || 'Date is required']"
    >
      <template #append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date v-model="date" mask="YYYY-MM-DD" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <!-- ✅ Time Picker -->
    <q-input
      v-model="time"
      label="Select time"
      filled
      dense
      readonly
      :rules="[(val) => !!val || 'Time is required']"
    >
      <template #append>
        <q-icon name="access_time" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-time v-model="time" format24h mask="HH:mm" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <q-btn type="submit" label="Submit" color="primary" class="q-mt-md" unelevated />
  </q-form>
</template>

<script setup>
import { computed, ref } from 'vue'
import { SurveyTypes } from '@/enums/SurveyTypes.js'
import { useI18n } from 'vue-i18n'

const i18n = useI18n();

const emit = defineEmits(['submit'])

const title = ref('')
const description = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const time = ref('19:00')
const surveyType = ref({
  label: i18n.t(`survey.type.${SurveyTypes.Training}`),
  value: SurveyTypes.Training,
});


const surveyTypeOptions = computed(() => {
  return Object.values(SurveyTypes).map((type) => ({
    label: i18n.t(`survey.type.${type}`),
    value: type,
  }))
})

function submitFormHandler() {
  emit('submit', {
    title: title.value,
    description: description.value,
    date: date.value,
    time: time.value,
    surveyType: surveyType.value.value,
  })

  // Reset inputs
  title.value = ''
  description.value = ''
  date.value = ''
  time.value = ''
}
</script>
