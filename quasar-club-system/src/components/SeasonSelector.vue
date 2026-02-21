<template>
  <q-btn-dropdown
    dense
    :label="seasonStore.activeSeason.label"
    icon="date_range"
    class="season-selector"
  >
    <q-list>
      <q-item-label header>{{ $t('season.selector') }}</q-item-label>

      <q-item
        v-for="season in seasonStore.seasons"
        :key="season.key"
        clickable
        v-close-popup
        @click="seasonStore.selectSeason(season.key)"
        :active="seasonStore.selectedSeasonKey === season.key"
      >
        <q-item-section avatar>
          <q-icon
            :name="seasonStore.selectedSeasonKey === season.key ? 'radio_button_checked' : 'radio_button_unchecked'"
            :color="seasonStore.selectedSeasonKey === season.key ? 'primary' : 'grey'"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ season.label }}</q-item-label>
          <q-item-label caption v-if="season.key === seasonStore.currentSeasonKey">
            {{ $t('season.current') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup>
import { useSeasonStore } from '@/stores/seasonStore'

const seasonStore = useSeasonStore()
</script>

<style scoped>
.season-selector {
  min-width: 120px;
}
</style>
