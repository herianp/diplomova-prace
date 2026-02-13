<template>
  <div>
    <div class="row items-center justify-center q-gutter-sm q-mt-sm">
      <q-chip color="grey-2" text-color="black" class="q-pa-sm">
        <q-icon name="how_to_vote" size="xs" class="q-mr-xs" />
        <span class="text-weight-medium">{{ $t('survey.votes.total') }}: {{ survey.votes.length }}</span>
      </q-chip>

      <q-chip color="green-3" text-color="black" class="q-pa-sm">
        <q-icon name="thumb_up" size="xs" class="q-mr-xs" />
        {{ yesCount }}
      </q-chip>

      <q-chip color="red-3" text-color="black" class="q-pa-sm">
        <q-icon name="thumb_down" size="xs" class="q-mr-xs" />
        {{ noCount }}
      </q-chip>

      <q-chip v-if="teamMemberCount" color="grey-3" text-color="grey-7" class="q-pa-sm">
        <q-icon name="person_off" size="xs" class="q-mr-xs" />
        {{ unvotedCount }}
      </q-chip>
    </div>

    <!-- Vote progress bar -->
    <div v-if="teamMemberCount" class="q-mt-sm q-px-md">
      <div class="vote-progress-bar">
        <div
          v-if="yesPercent > 0"
          class="vote-segment vote-yes"
          :style="{ width: yesPercent + '%' }"
        />
        <div
          v-if="noPercent > 0"
          class="vote-segment vote-no"
          :style="{ width: noPercent + '%' }"
        />
        <div
          v-if="unvotedPercent > 0"
          class="vote-segment vote-unvoted"
          :style="{ width: unvotedPercent + '%' }"
        />
      </div>
      <div class="row justify-between text-caption text-grey-6 q-mt-xs">
        <span>{{ yesCount }} {{ $t('common.yes').toLowerCase() }}</span>
        <span>{{ noCount }} {{ $t('common.no').toLowerCase() }}</span>
        <span>{{ unvotedCount }} {{ $t('survey.votes.unvoted') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { countPositiveVotes, countNegativeVotes } from '@/utils/voteUtils'

const props = defineProps({
  survey: {
    type: Object,
    required: true
  },
  teamMemberCount: {
    type: Number,
    default: 0
  }
})

const yesCount = computed(() => countPositiveVotes(props.survey.votes))
const noCount = computed(() => countNegativeVotes(props.survey.votes))
const unvotedCount = computed(() => {
  if (!props.teamMemberCount) return 0
  return Math.max(0, props.teamMemberCount - props.survey.votes.length)
})

const total = computed(() => props.teamMemberCount || props.survey.votes.length || 1)
const yesPercent = computed(() => Math.round((yesCount.value / total.value) * 100))
const noPercent = computed(() => Math.round((noCount.value / total.value) * 100))
const unvotedPercent = computed(() => 100 - yesPercent.value - noPercent.value)
</script>

<style scoped>
.vote-progress-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #e0e0e0;
}

.vote-segment {
  transition: width 0.3s ease;
}

.vote-yes {
  background-color: #4caf50;
}

.vote-no {
  background-color: #f44336;
}

.vote-unvoted {
  background-color: #e0e0e0;
}
</style>
