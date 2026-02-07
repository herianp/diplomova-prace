<template>
  <div>
    <div v-if="surveys.length === 0" class="no-surveys">
      <q-icon name="poll" size="3rem" color="grey-5" />
      <p class="text-grey-6 q-mt-md">{{ $t('dashboard.noSurveys') }}</p>
    </div>

    <div v-else>
      <div
        v-for="survey in surveys"
        :key="survey.id"
        class="survey-item q-mb-md"
      >
        <q-card flat bordered class="survey-card">
          <q-card-section class="q-pa-md">
            <div class="row items-center">
              <div class="col">
                <div class="survey-title">{{ survey.title }}</div>
                <div class="survey-meta">
                  <q-chip
                    :color="getSurveyTypeColor(survey.type)"
                    text-color="white"
                    size="sm"
                    :label="survey.type"
                  />
                  <span class="survey-date">{{ formatDate(survey.date, survey.time) }}</span>
                </div>
                <div class="survey-description text-grey-7" v-if="survey.description">
                  {{ survey.description }}
                </div>
              </div>

              <div class="col-auto">
                <div class="voting-section">
                  <div class="vote-stats">
                    <div class="vote-count positive">
                      <q-icon name="thumb_up" size="sm" />
                      <span>{{ countPositiveVotes(survey.votes || []) }}</span>
                    </div>
                    <div class="vote-count negative">
                      <q-icon name="thumb_down" size="sm" />
                      <span>{{ countNegativeVotes(survey.votes || []) }}</span>
                    </div>
                  </div>

                  <div class="my-vote">
                    <q-chip
                      v-if="getUserVote(survey) !== null"
                      :color="getUserVote(survey) === true ? 'positive' : 'negative'"
                      text-color="white"
                      size="sm"
                      :icon="getUserVote(survey) === true ? 'thumb_up' : 'thumb_down'"
                      :label="getUserVote(survey) === true ? $t('dashboard.voted.yes') : $t('dashboard.voted.no')"
                    />
                    <q-chip
                      v-else
                      color="grey-5"
                      text-color="white"
                      size="sm"
                      icon="remove"
                      :label="$t('dashboard.voted.notVoted')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
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
    'TRAINING': 'blue',
    'MATCH': 'green',
    'EVENT': 'purple',
    'MEETING': 'orange',
    'OTHER': 'grey'
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
  padding: 2rem;
}

.survey-card {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.survey-card:hover {
  border-left-color: #1976d2;
  transform: translateX(4px);
}

.survey-title {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.survey-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.survey-date {
  font-size: 0.875rem;
  color: #666;
}

.survey-description {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.voting-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.vote-stats {
  display: flex;
  gap: 0.5rem;
}

.vote-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.vote-count.positive {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.vote-count.negative {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.my-vote {
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .survey-card .row {
    flex-direction: column;
    align-items: flex-start;
  }

  .voting-section {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    margin-top: 1rem;
  }

  .survey-description {
    max-width: 100%;
  }
}
</style>
