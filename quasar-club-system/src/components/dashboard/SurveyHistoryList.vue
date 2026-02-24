<template>
  <div>
    <div v-if="surveys.length === 0" class="no-surveys">
      <q-icon name="poll" size="3rem" color="grey-4" />
      <p class="text-grey-5 q-mt-sm text-body2">{{ $t('dashboard.noSurveys') }}</p>
    </div>

    <div v-else class="survey-list">
      <q-card
        v-for="survey in surveys"
        :key="survey.id"
        flat
        bordered
        class="survey-card q-mb-sm"
      >
        <q-card-section class="q-pa-md">
          <div class="row items-start justify-between no-wrap q-mb-xs">
            <div class="text-subtitle1 text-weight-medium ellipsis" style="flex: 1; min-width: 0;">
              {{ $t('survey.type.' + survey.type) }}
            </div>
            <q-chip
              v-if="getUserVote(survey) !== null"
              :color="getUserVote(survey) === true ? 'positive' : 'negative'"
              text-color="white"
              size="sm"
              dense
              :icon="getUserVote(survey) === true ? 'thumb_up' : 'thumb_down'"
              :label="getUserVote(survey) === true ? $t('dashboard.voted.yes') : $t('dashboard.voted.no')"
              class="q-ml-sm"
            />
            <q-chip
              v-else
              color="grey-4"
              text-color="grey-7"
              size="sm"
              dense
              icon="remove"
              :label="$t('dashboard.voted.notVoted')"
              class="q-ml-sm"
            />
          </div>

          <div class="row items-center q-gutter-x-sm q-mb-sm">
            <q-chip
              :color="getSurveyTypeColor(survey.type)"
              text-color="white"
              size="xs"
              dense
              :label="survey.type"
            />
            <span class="text-caption text-grey-6">{{ formatDate(survey.date, survey.time) }}</span>
          </div>

          <div class="row items-center q-gutter-x-md">
            <div class="vote-badge positive">
              <q-icon name="thumb_up" size="14px" />
              <span>{{ countPositiveVotes(survey.votes || []) }}</span>
            </div>
            <div class="vote-badge negative">
              <q-icon name="thumb_down" size="14px" />
              <span>{{ countNegativeVotes(survey.votes || []) }}</span>
            </div>
          </div>

          <div class="text-caption text-grey-6 q-mt-sm ellipsis-2-lines" v-if="survey.description">
            {{ survey.description }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { useDateHelpers } from '@/composable/useDateHelpers'
import { countPositiveVotes, countNegativeVotes } from '@/utils/voteUtils'

const props = defineProps({
  surveys: {
    type: Array,
    default: () => []
  },
  currentUserUid: {
    type: String,
    default: null
  }
})
const { getDisplayedDateTime } = useDateHelpers()

// Methods
const getUserVote = (survey) => {
  const vote = survey.votes?.find(v => v.userUid === props.currentUserUid)
  return vote ? vote.vote : null
}

const getSurveyTypeColor = (type) => {
  const colors = {
    'training': 'blue',
    'match': 'green',
    'friendly-match': 'orange',
  }
  return colors[type] || 'grey'
}

const formatDate = (date, time) => {
  try {
    return getDisplayedDateTime(date, time)
  } catch {
    return `${date} ${time}`
  }
}
</script>

<style scoped>
.no-surveys {
  text-align: center;
  padding: 2rem 1rem;
}

.survey-card {
  border-radius: 8px;
}

.vote-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
}

.vote-badge.positive {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.vote-badge.negative {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
