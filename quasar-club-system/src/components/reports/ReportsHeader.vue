<template>
  <!-- Header -->
  <div class="page-header q-mb-lg">
    <h2 v-if="!isMobile" class="text-center q-ma-none q-pa-none">
      {{ $t('reports.title') }}
    </h2>
    <div v-if="currentTeam" class="text-center text-grey-6 q-mt-sm">
      {{ currentTeam.name }} - {{ $t('reports.teamMetrics') }}
    </div>
  </div>

  <!-- No Team Selected -->
  <div v-if="!currentTeam" class="no-team text-center q-pa-xl">
    <q-icon name="analytics" size="4em" color="grey-4" class="q-mb-md" />
    <div class="text-h5 text-grey-6 q-mb-sm">{{ $t('reports.noTeam') }}</div>
    <div class="text-body2 text-grey-5">{{ $t('reports.selectTeamFirst') }}</div>
  </div>
</template>

<script setup>
import { useScreenComposable } from '@/composable/useScreenComposable.js'

defineProps({
  currentTeam: {
    type: Object,
    default: null
  }
})

const { isMobile } = useScreenComposable()
</script>

<style scoped>
.no-team {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>