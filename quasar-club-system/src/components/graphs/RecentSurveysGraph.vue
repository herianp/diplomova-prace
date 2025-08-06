<template>
  <div class="recent-surveys q-mb-lg">
    <q-card flat bordered class="full-width">
      <q-card-section class="q-pa-none">
        <div class="row items-center q-pa-md">
          <div class="col">
            <h5 class="q-ma-none">{{ $t('dashboard.recentSurveys') }}</h5>
            <p class="text-grey-7 q-ma-none">{{ $t('dashboard.last5Surveys') }}</p>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              round
              icon="refresh"
              @click="refreshData"
              :loading="isLoading"
            />
          </div>
        </div>

        <div class="q-px-md q-pb-md overflow-auto">
          <SurveyHistoryList
            :surveys="surveys"
            :current-user-uid="currentUserUid"
          />
        </div>
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

<style scoped>
.recent-surveys {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
