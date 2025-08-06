<template>
  <div>
    <h2 v-if="!isMobile" style="text-align: center" class="q-ma-none q-pa-none">{{ $t('survey.title') }}</h2>

    <!-- Filter Menu -->
    <SurveyFilterMenu 
      v-model="filters"
      @filters-changed="onFiltersChanged"
      class="q-ma-lg"
    />

    <!-- Create Survey Menu -->
    <SurveyCreateMenu 
      :is-power-user="isPowerUser"
      @survey-created="handleSurveySubmit"
      class="q-ma-lg"
    />

    <div class="row wrap q-col-gutter-lg q-pa-lg justify-start">
      <div
        v-for="survey in surveys"
        :key="survey.id"
        class="col-12"
      >
        <SurveyCard v-if="!isMobile" :survey="survey" />
        <SurveyCardMobile v-else :survey="survey" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { DateTime } from 'luxon'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useAuthComposable } from '@/composable/useAuthComposable'
import SurveyCard from '@/components/new/SurveyCard.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useDateHelpers } from '@/composable/useDateHelpers.ts'
import { useTeamComposable } from '@/composable/useTeamComposable.js'
import { useI18n } from 'vue-i18n'
import { useScreenComposable } from '@/composable/useScreenComposable.js'
import SurveyCardMobile from '@/components/new/SurveyCardMobile.vue'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
import SurveyCreateMenu from '@/components/survey/SurveyCreateMenu.vue'

const auth = getAuth()
const teamStore = useTeamStore()
const { currentUser } = useAuthComposable()
const { isMobile } = useScreenComposable()
const i18n = useI18n()
const { getDateByDateAndTime } = useDateHelpers(i18n.locale.value)
const { addSurvey } = useTeamComposable()

// Filter state
const filters = ref({
  searchName: '',
  dateFrom: '',
  dateTo: ''
})

const surveys = computed(() => {
  let filteredSurveys = [...teamStore.surveys]
  
  // 1. Apply name search filter
  if (filters.value.searchName.trim()) {
    const searchTerm = filters.value.searchName.toLowerCase().trim()
    filteredSurveys = filteredSurveys.filter(survey => 
      survey.title.toLowerCase().includes(searchTerm)
    )
  }
  
  // 2. Apply date range filter
  if (filters.value.dateFrom || filters.value.dateTo) {
    filteredSurveys = filteredSurveys.filter(survey => {
      const surveyDate = survey.date
      
      // If both dates are set, check if survey is within range
      if (filters.value.dateFrom && filters.value.dateTo) {
        return surveyDate >= filters.value.dateFrom && surveyDate <= filters.value.dateTo
      }
      
      // If only dateFrom is set, check if survey is on or after that date
      if (filters.value.dateFrom) {
        return surveyDate >= filters.value.dateFrom
      }
      
      // If only dateTo is set, check if survey is on or before that date
      if (filters.value.dateTo) {
        return surveyDate <= filters.value.dateTo
      }
      
      return true
    })
  } else {
    // 3. If no date range is specified, show only recent surveys (past 1 day)
    const now = DateTime.now()
    const cutoffDate = now.minus({ days: 1 }).toISODate()
    filteredSurveys = filteredSurveys.filter(survey => survey.date >= cutoffDate)
  }
  
  // 4. Sort: oldest first (ascending order)
  return filteredSurveys.sort((a, b) => a.date.localeCompare(b.date))
})

const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() => currentTeam.value?.powerusers.includes(currentUser.value.uid))

function onFiltersChanged(newFilters) {
  filters.value = { ...newFilters }
}

async function handleSurveySubmit(payload) {
  try {
    await addSurvey({
      title: payload.title,
      description: payload.description,
      date: payload.date,
      time: payload.time,
      dateTime: getDateByDateAndTime(payload.date, payload.time),
      teamId: currentTeam.value.id,
      type: payload.surveyType,
    })
    console.log('Survey created successfully:', payload)
  } catch (err) {
    console.error('Error creating survey:', err)
    throw err // Re-throw to let SurveyCreateMenu handle the error
  }
}

onMounted(async () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      teamStore.setSurveysListener(teamStore.currentTeam.id)
    } else {
      console.error('No authenticated user found.')
    }
  })
})
</script>

<style scoped>

</style>
