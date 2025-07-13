<template>
  <div class="voting-chart">
    <div v-if="chartData.length === 0" class="no-data">
      <q-icon name="timeline" size="2rem" color="grey-5" />
      <p class="text-grey-6 q-mt-sm">{{ $t('dashboard.noVotingData') }}</p>
    </div>
    
    <div v-else class="chart-container">
      <div class="chart-legend q-mb-md">
        <div class="legend-item">
          <div class="legend-color positive"></div>
          <span>{{ $t('dashboard.votedYes') }}</span>
        </div>
        <div class="legend-item">
          <div class="legend-color negative"></div>
          <span>{{ $t('dashboard.votedNo') }}</span>
        </div>
        <div class="legend-item">
          <div class="legend-color abstain"></div>
          <span>{{ $t('dashboard.didNotVote') }}</span>
        </div>
      </div>
      
      <div class="chart-bars">
        <div 
          v-for="(item, index) in chartData" 
          :key="index"
          class="chart-bar-container"
        >
          <div class="survey-info">
            <div class="survey-title-short">{{ truncateTitle(item.title) }}</div>
            <div class="survey-date-short">{{ formatShortDate(item.date) }}</div>
          </div>
          
          <div class="bar-wrapper">
            <div class="chart-bar">
              <div 
                class="bar-segment positive"
                :style="{ width: item.positivePercentage + '%' }"
                v-if="item.positivePercentage > 0"
              >
                <span class="bar-label" v-if="item.positivePercentage > 15">
                  {{ item.positiveVotes }}
                </span>
              </div>
              <div 
                class="bar-segment negative"
                :style="{ width: item.negativePercentage + '%' }"
                v-if="item.negativePercentage > 0"
              >
                <span class="bar-label" v-if="item.negativePercentage > 15">
                  {{ item.negativeVotes }}
                </span>
              </div>
              <div 
                class="bar-segment abstain"
                :style="{ width: item.abstainPercentage + '%' }"
                v-if="item.abstainPercentage > 0"
              >
                <span class="bar-label" v-if="item.abstainPercentage > 15">
                  {{ item.abstainVotes }}
                </span>
              </div>
            </div>
            
            <div class="user-vote-indicator" v-if="item.userVote !== null">
              <q-icon 
                :name="item.userVote ? 'thumb_up' : 'thumb_down'"
                :color="item.userVote ? 'positive' : 'negative'"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTeamStore } from '@/stores/teamStore'

const props = defineProps({
  surveys: {
    type: Array,
    default: () => []
  },
  userUid: {
    type: String,
    default: null
  }
})
const teamStore = useTeamStore()

const chartData = computed(() => {
  if (!props.surveys.length) return []
  
  return props.surveys.map(survey => {
    const totalMembers = teamStore.currentTeam?.members?.length || 1
    const positiveVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
    const negativeVotes = survey.votes?.filter(vote => vote.vote === false).length || 0
    const totalVotes = positiveVotes + negativeVotes
    const abstainVotes = totalMembers - totalVotes
    
    const userVote = survey.votes?.find(vote => vote.userUid === props.userUid)
    
    return {
      title: survey.title,
      date: survey.date,
      positiveVotes,
      negativeVotes,
      abstainVotes,
      positivePercentage: totalMembers > 0 ? (positiveVotes / totalMembers) * 100 : 0,
      negativePercentage: totalMembers > 0 ? (negativeVotes / totalMembers) * 100 : 0,
      abstainPercentage: totalMembers > 0 ? (abstainVotes / totalMembers) * 100 : 0,
      userVote: userVote ? userVote.vote : null
    }
  })
})

const truncateTitle = (title) => {
  return title.length > 20 ? title.substring(0, 20) + '...' : title
}

const formatShortDate = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.voting-chart {
  min-height: 200px;
}

.no-data {
  text-align: center;
  padding: 2rem;
}

.chart-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.positive {
  background: #4caf50;
}

.legend-color.negative {
  background: #f44336;
}

.legend-color.abstain {
  background: #9e9e9e;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-bar-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.survey-info {
  min-width: 120px;
  flex-shrink: 0;
}

.survey-title-short {
  font-weight: 500;
  font-size: 0.875rem;
  color: #333;
}

.survey-date-short {
  font-size: 0.75rem;
  color: #666;
}

.bar-wrapper {
  flex: 1;
  position: relative;
}

.chart-bar {
  display: flex;
  height: 24px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  min-width: 100px;
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.bar-segment.positive {
  background: #4caf50;
}

.bar-segment.negative {
  background: #f44336;
}

.bar-segment.abstain {
  background: #9e9e9e;
}

.bar-label {
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.user-vote-indicator {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
}

@media (max-width: 768px) {
  .chart-bar-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .survey-info {
    min-width: auto;
    width: 100%;
  }
  
  .bar-wrapper {
    width: 100%;
  }
  
  .user-vote-indicator {
    position: static;
    transform: none;
    margin-top: 0.5rem;
  }
}
</style>