<template>
  <div class="survey-types-chart">
    <div v-if="chartData.length === 0" class="no-data">
      <q-icon name="pie_chart" size="2rem" color="grey-5" />
      <p class="text-grey-6 q-mt-sm">{{ $t('dashboard.noSurveyTypes') }}</p>
    </div>
    
    <div v-else class="chart-container">
      <div class="pie-chart-container">
        <svg width="200" height="200" class="pie-chart">
          <g transform="translate(100, 100)">
            <path
              v-for="(segment, index) in pieSegments"
              :key="index"
              :d="segment.path"
              :fill="segment.color"
              :stroke="'white'"
              :stroke-width="2"
              class="pie-segment"
            />
            <text
              v-for="(segment, index) in visibleLabels"
              :key="'label-' + index"
              :x="segment.labelX"
              :y="segment.labelY"
              text-anchor="middle"
              class="pie-label"
            >
              {{ segment.percentage }}%
            </text>
          </g>
        </svg>
      </div>
      
      <div class="chart-legend-vertical">
        <div 
          v-for="(item, index) in chartData" 
          :key="index"
          class="legend-item-vertical"
        >
          <div 
            class="legend-color-large"
            :style="{ backgroundColor: getTypeColor(item.type) }"
          ></div>
          <div class="legend-text">
            <div class="type-name">{{ item.type }}</div>
            <div class="type-stats">
              {{ item.count }} {{ $t('dashboard.surveys') }} ({{ item.percentage }}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  surveys: {
    type: Array,
    default: () => []
  }
})

const typeColors = {
  'TRAINING': '#2196f3',
  'MATCH': '#4caf50',
  'EVENT': '#9c27b0',
  'MEETING': '#ff9800',
  'OTHER': '#607d8b'
}

const getTypeColor = (type) => {
  return typeColors[type] || '#9e9e9e'
}

const chartData = computed(() => {
  if (!props.surveys.length) return []
  
  const typeCounts = {}
  props.surveys.forEach(survey => {
    const type = survey.type || 'OTHER'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  
  const total = props.surveys.length
  
  return Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / total) * 100)
  })).sort((a, b) => b.count - a.count)
})

const pieSegments = computed(() => {
  if (!chartData.value.length) return []
  
  let currentAngle = 0
  const radius = 80
  
  return chartData.value.map(item => {
    const angle = (item.percentage / 100) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    const x1 = Math.cos(startAngle) * radius
    const y1 = Math.sin(startAngle) * radius
    const x2 = Math.cos(endAngle) * radius
    const y2 = Math.sin(endAngle) * radius
    
    const largeArcFlag = angle > Math.PI ? 1 : 0
    
    const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    
    // Calculate label position
    const labelAngle = startAngle + angle / 2
    const labelRadius = radius * 0.7
    const labelX = Math.cos(labelAngle) * labelRadius
    const labelY = Math.sin(labelAngle) * labelRadius
    
    currentAngle = endAngle
    
    return {
      path,
      color: getTypeColor(item.type),
      percentage: item.percentage,
      labelX,
      labelY
    }
  })
})

const visibleLabels = computed(() => {
  return pieSegments.value.filter(segment => segment.percentage > 10)
})
</script>

<style scoped>
.survey-types-chart {
  min-height: 200px;
}

.no-data {
  text-align: center;
  padding: 2rem;
}

.chart-container {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}

.pie-chart-container {
  flex-shrink: 0;
}

.pie-segment {
  transition: all 0.3s ease;
  cursor: pointer;
}

.pie-segment:hover {
  opacity: 0.8;
  transform: scale(1.05);
  transform-origin: center;
}

.pie-label {
  font-size: 12px;
  font-weight: bold;
  fill: white;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
}

.chart-legend-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend-item-vertical {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.legend-color-large {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-text {
  flex: 1;
}

.type-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: #333;
}

.type-stats {
  font-size: 0.75rem;
  color: #666;
}

@media (max-width: 768px) {
  .chart-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pie-chart-container svg {
    width: 150px;
    height: 150px;
  }
  
  .chart-legend-vertical {
    width: 100%;
  }
}
</style>