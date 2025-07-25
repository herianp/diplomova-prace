<template>
  <!-- Team Statistics Section (Not affected by player filter) -->
  <div class="team-stats-section q-mb-sm">
    <div class="text-h6 q-mb-md">{{ $t('reports.teamStatistics') }}</div>
    <div class="row">
      <div class="col-6 col-md-3 q-pa-xs">
        <q-card flat bordered class="metric-card bg-blue-1">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h4 text-blue-8 q-mb-xs">{{ teamMetrics.totalSurveys }}</div>
            <div class="text-caption text-blue-6">{{ $t('reports.totalSurveys') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3 q-pa-xs">
        <q-card flat bordered class="metric-card bg-green-1">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h4 text-green-8 q-mb-xs">{{ teamMetrics.totalMembers }}</div>
            <div class="text-caption text-green-6">{{ $t('reports.totalMembers') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3 q-pa-xs">
        <q-card flat bordered class="metric-card bg-orange-1">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h4 text-orange-8 q-mb-xs">{{ teamMetrics.averageParticipation }}%</div>
            <div class="text-caption text-orange-6">{{ $t('reports.avgTeamParticipation') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3 q-pa-xs">
        <q-card flat bordered class="metric-card bg-purple-1">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h4 text-purple-8 q-mb-xs">{{ teamMetrics.activeSurveys }}</div>
            <div class="text-caption text-purple-6">{{ $t('reports.activeSurveys') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  teamMetrics: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.metric-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
