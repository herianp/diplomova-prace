<template>
  <div class="recent-surveys q-mb-lg">
    <q-card flat bordered class="full-width">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <q-icon name="history" size="sm" color="primary" class="q-mr-sm" />
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.recentSurveys') }}</div>
            <div class="text-caption text-grey-6">{{ $t('dashboard.last5Surveys') }}</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="refresh"
            color="grey-7"
            size="sm"
            @click="refreshData"
            :loading="isLoading"
          />
        </div>

        <SurveyHistoryList
          :surveys="surveys"
          :current-user-uid="currentUserUid"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import SurveyHistoryList from '@/components/dashboard/SurveyHistoryList.vue'

defineProps({
  surveys: {
    type: Array,
    required: true
  },
  currentUserUid: {
    type: String,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const refreshData = () => {
  emit('refresh')
}
</script>
