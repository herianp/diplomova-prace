import { ref, onUnmounted, type Ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

/**
 * Composable for lazy-loading Chart.js charts using Intersection Observer
 *
 * Usage:
 * - Attach `chartContainer` ref to the element that wraps the chart
 * - Use `isVisible` to conditionally render chart canvas vs skeleton placeholder
 * - `hasRendered` ensures chart is created only once (persists after scroll)
 *
 * @returns Object with chartContainer ref, isVisible flag, and hasRendered flag
 *
 * @example
 * ```vue
 * <template>
 *   <div ref="chartContainer">
 *     <canvas v-if="isVisible" ref="chartRef"></canvas>
 *     <q-skeleton v-else type="rect" height="400px" />
 *   </div>
 * </template>
 *
 * <script setup>
 * const { chartContainer, isVisible } = useChartLazyLoad()
 *
 * watch(isVisible, async (visible) => {
 *   if (visible) {
 *     await nextTick()
 *     createChart()
 *   }
 * })
 * </script>
 * ```
 */
export function useChartLazyLoad() {
  const chartContainer: Ref<HTMLElement | null> = ref(null)
  const isVisible = ref(false)
  const hasRendered = ref(false)

  const { stop } = useIntersectionObserver(
    chartContainer,
    ([entry]) => {
      // Trigger visibility on first intersection, then stop observing
      if (entry.isIntersecting && !hasRendered.value) {
        isVisible.value = true
        hasRendered.value = true
        stop()
      }
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  )

  // Safety cleanup on unmount
  onUnmounted(() => {
    stop()
  })

  return {
    chartContainer,
    isVisible,
    hasRendered
  }
}
