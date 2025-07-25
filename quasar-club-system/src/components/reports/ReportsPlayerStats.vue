<template>
  <!-- Player Statistics Section (Only shown when player is selected) -->
  <div v-if="selectedPlayer" class="player-stats-section q-mb-lg">
    <div class="text-h6 q-mb-md">{{ $t('reports.playerStatistics') }}: {{ getPlayerName(selectedPlayer) }}</div>
    <div class="row">
      <div class="col-6 col-md-3 q-pa-xs">
        <q-card flat bordered class="metric-card bg-green-1">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h4 text-green-8 q-mb-xs">{{ playerMetrics.yesVotes }}</div>
            <div class="text-caption text-green-6">{{ $t('reports.attendance') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3 q-pa-xs">
        <q-card flat bordered class="metric-card bg-red-1">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h4 text-red-8 q-mb-xs">{{ playerMetrics.noVotes }}</div>
            <div class="text-caption text-red-6">{{ $t('reports.nonAttendance') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3 q-pa-xs">
        <q-card flat bordered class="metric-card bg-grey-1">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h4 text-grey-8 q-mb-xs">{{ playerMetrics.unvoted }}</div>
            <div class="text-caption text-grey-6">{{ $t('reports.unvoted') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3 q-pa-xs">
        <q-card flat bordered class="metric-card bg-blue-1">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h4 text-blue-8 q-mb-xs">{{ playerMetrics.averageParticipation }}%</div>
            <div class="text-caption text-blue-6">{{ $t('reports.avgPlayerParticipation') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  selectedPlayer: {
    type: String,
    default: null
  },
  playerMetrics: {
    type: Object,
    required: true
  },
  getPlayerName: {
    type: Function,
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