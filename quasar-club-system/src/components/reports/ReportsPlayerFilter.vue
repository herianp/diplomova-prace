<template>
  <!-- Player Filter Section -->
  <div class="player-filter-section q-mb-lg">
    <q-card flat bordered class="q-pa-md">
      <div class="text-h6 q-mb-md">{{ $t('reports.playerFilter') }}</div>
      <div class="row q-gutter-md items-end">
        <!-- Player Filter -->
        <div class="col-12 col-md-6">
          <q-select
            :model-value="selectedPlayer"
            @update:model-value="$emit('update:selectedPlayer', $event)"
            :options="playerOptions"
            :label="$t('reports.selectPlayer')"
            emit-value
            map-options
            clearable
            outlined
            dense
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-select>
        </div>

        <!-- Reset Player Filter -->
        <div class="col-12 col-md-3">
          <q-btn
            v-if="selectedPlayer"
            color="grey-7"
            icon="person_off"
            :label="$t('reports.clearPlayerFilter')"
            @click="$emit('update:selectedPlayer', null)"
            outline
            dense
          />
        </div>
      </div>

      <!-- Player Filter Info -->
      <div v-if="selectedPlayer" class="q-mt-md">
        <q-chip
          :label="`${$t('reports.player')}: ${getPlayerName(selectedPlayer)}`"
          removable
          @remove="$emit('update:selectedPlayer', null)"
          color="primary"
          text-color="white"
        />
        <div class="q-mt-sm text-caption text-grey-6">
          {{ $t('reports.playerFilterInfo') }}
        </div>
      </div>
    </q-card>
  </div>
</template>

<script setup>
defineEmits(['update:selectedPlayer'])

defineProps({
  selectedPlayer: {
    type: String,
    default: null
  },
  playerOptions: {
    type: Array,
    required: true
  },
  getPlayerName: {
    type: Function,
    required: true
  }
})
</script>

<style scoped>
</style>