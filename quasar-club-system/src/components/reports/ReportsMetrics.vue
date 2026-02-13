<template>
  <div class="metrics-section q-mb-lg">
    <!-- Team Metrics (no player selected) -->
    <template v-if="!selectedPlayer">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('reports.teamStatistics') }}</div>
      <div class="row q-col-gutter-sm items-stretch">
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('reports.totalSurveys')"
            :value="teamMetrics.totalSurveys"
            icon="poll"
            color="primary"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('reports.totalMembers')"
            :value="teamMetrics.totalMembers"
            icon="groups"
            color="positive"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('reports.avgTeamParticipation')"
            :value="teamMetrics.averageParticipation + '%'"
            icon="trending_up"
            color="warning"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('reports.activeSurveys')"
            :value="teamMetrics.activeSurveys"
            icon="schedule"
            color="accent"
          />
        </div>
      </div>
    </template>

    <!-- Player Metrics (player selected) -->
    <template v-else>
      <div class="text-subtitle1 text-weight-medium q-mb-sm">
        {{ $t('reports.playerStatistics') }}: {{ getPlayerName(selectedPlayer) }}
      </div>
      <div class="row q-col-gutter-sm items-stretch">
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('reports.attendance')"
            :value="playerMetrics.yesVotes"
            icon="check_circle"
            color="positive"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('reports.nonAttendance')"
            :value="playerMetrics.noVotes"
            icon="cancel"
            color="negative"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('reports.unvoted')"
            :value="playerMetrics.unvoted"
            icon="help_outline"
            color="grey-6"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('reports.avgPlayerParticipation')"
            :value="playerMetrics.averageParticipation + '%'"
            icon="person"
            color="primary"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import MetricCard from '@/components/dashboard/MetricCard.vue'

defineProps({
  teamMetrics: {
    type: Object,
    required: true
  },
  playerMetrics: {
    type: Object,
    required: true
  },
  selectedPlayer: {
    type: String,
    default: null
  },
  getPlayerName: {
    type: Function,
    required: true
  }
})
</script>
