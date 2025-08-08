import { ref, onUnmounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  DoughnutController,
  PieController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartConfiguration,
  ChartType
} from 'chart.js'

export interface ChartData {
  labels: string[]
  datasets: any[]
}

export interface ChartOptions {
  responsive?: boolean
  maintainAspectRatio?: boolean
  plugins?: any
  scales?: any
  [key: string]: any
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  DoughnutController,
  PieController,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export function useChartHelpers() {

  /**
   * Common color palettes for charts
   */
  const colors = {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036'
    },
    success: {
      main: '#388e3c',
      light: '#66bb6a',
      dark: '#2e7d32'
    },
    warning: {
      main: '#f57c00',
      light: '#ffb74d',
      dark: '#ef6c00'
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828'
    },
    info: {
      main: '#1976d2',
      light: '#64b5f6',
      dark: '#1565c0'
    },
    palette: [
      '#1976d2', '#dc004e', '#388e3c', '#f57c00',
      '#9c27b0', '#00acc1', '#fbc02d', '#f57c00',
      '#795548', '#607d8b', '#e91e63', '#3f51b5'
    ]
  }

  /**
   * Default chart options
   */
  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 6
      }
    }
  }

  /**
   * Create a chart instance with automatic cleanup
   */
  const createChart = (
    canvasRef: any,
    type: ChartType,
    data: ChartData,
    options: ChartOptions = {}
  ) => {
    const chartInstance = ref<ChartJS | null>(null)

    const initChart = () => {
      if (canvasRef.value) {
        const config: ChartConfiguration = {
          type,
          data,
          options: { ...defaultOptions, ...options }
        }

        chartInstance.value = new ChartJS(canvasRef.value, config)
      }
    }

    const updateChart = (newData: ChartData, newOptions?: ChartOptions) => {
      if (chartInstance.value) {
        chartInstance.value.data = newData
        if (newOptions) {
          chartInstance.value.options = { ...chartInstance.value.options, ...newOptions }
        }
        chartInstance.value.update()
      }
    }

    const destroyChart = () => {
      if (chartInstance.value) {
        chartInstance.value.destroy()
        chartInstance.value = null
      }
    }

    return {
      chartInstance,
      initChart,
      updateChart,
      destroyChart
    }
  }

  /**
   * Generate line chart configuration for survey participation over time
   */
  const createParticipationLineChart = (surveys: any[], userUid?: string): ChartData => {
    const sortedSurveys = surveys.sort((a, b) => a.date.localeCompare(b.date))

    const labels = sortedSurveys.map(survey => {
      const date = new Date(survey.date)
      return date.toLocaleDateString()
    })

    const participationData = sortedSurveys.map(survey => {
      const totalVotes = survey.votes?.length || 0
      const yesVotes = survey.votes?.filter((vote: any) => vote.vote === true).length || 0
      return totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0
    })

    let userParticipationData: number[] = []
    if (userUid) {
      userParticipationData = sortedSurveys.map(survey => {
        const userVote = survey.votes?.find((vote: any) => vote.userUid === userUid)
        return userVote ? (userVote.vote ? 100 : 0) : null
      })
    }

    const datasets = [
      {
        label: 'Team Participation %',
        data: participationData,
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.light + '20',
        tension: 0.4,
        fill: true
      }
    ]

    if (userUid) {
      datasets.push({
        label: 'Your Participation',
        data: userParticipationData,
        borderColor: colors.secondary.main,
        backgroundColor: colors.secondary.main,
        pointStyle: 'circle',
        pointRadius: 6,
        showLine: false
      })
    }

    return { labels, datasets }
  }

  /**
   * Generate doughnut chart for survey types
   */
  const createSurveyTypesChart = (surveys: any[]): ChartData => {
    const typeCounts: Record<string, number> = {}

    surveys.forEach(survey => {
      const type = survey.type || 'Unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    const labels = Object.keys(typeCounts)
    const data = Object.values(typeCounts)

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.palette.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    }
  }

  /**
   * Generate bar chart for member activity
   */
  const createMemberActivityChart = (members: any[], surveys: any[]): ChartData => {
    const memberStats = members.map(member => {
      const yesVotes = surveys.reduce((count, survey) => {
        const vote = survey.votes?.find((v: any) => v.userUid === member.uid)
        return count + (vote && vote.vote === true ? 1 : 0)
      }, 0)

      return {
        name: member.displayName || member.email || 'Unknown',
        yesVotes
      }
    }).sort((a, b) => b.yesVotes - a.yesVotes)

    return {
      labels: memberStats.map(stat => stat.name),
      datasets: [{
        label: 'Yes Votes',
        data: memberStats.map(stat => stat.yesVotes),
        backgroundColor: colors.success.main,
        borderColor: colors.success.dark,
        borderWidth: 1
      }]
    }
  }

  /**
   * Generate options for responsive charts
   */
  const getResponsiveOptions = (title?: string): ChartOptions => ({
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: title ? {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      } : undefined
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      }
    }
  })

  /**
   * Generate options for doughnut/pie charts
   */
  const getDoughnutOptions = (title?: string): ChartOptions => ({
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: title ? {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      } : undefined,
      legend: {
        position: 'bottom' as const
      }
    }
  })

  /**
   * Cleanup function for chart instances
   */
  const useChartCleanup = (charts: Array<{ destroyChart: () => void }>) => {
    onUnmounted(() => {
      charts.forEach(chart => chart.destroyChart())
    })
  }

  /**
   * Format number for chart tooltips
   */
  const formatTooltipValue = (value: number, context: any): string => {
    const label = context.label || ''
    const datasetLabel = context.dataset.label || ''

    if (datasetLabel.includes('%') || datasetLabel.includes('Participation')) {
      return `${label}: ${value}%`
    }

    return `${label}: ${value}`
  }

  /**
   * Generate gradient background for charts
   */
  const createGradient = (ctx: CanvasRenderingContext2D, colorStart: string, colorEnd: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, colorStart)
    gradient.addColorStop(1, colorEnd)
    return gradient
  }

  return {
    colors,
    defaultOptions,
    createChart,
    createParticipationLineChart,
    createSurveyTypesChart,
    createMemberActivityChart,
    getResponsiveOptions,
    getDoughnutOptions,
    useChartCleanup,
    formatTooltipValue,
    createGradient
  }
}
