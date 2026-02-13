import { computed, ComputedRef } from 'vue'
import { useQuasar } from 'quasar'

interface ScreenComposable {
  isMobile: ComputedRef<boolean>
  isTablet: ComputedRef<boolean>
  isDesktop: ComputedRef<boolean>
  width: ComputedRef<number>
  height: ComputedRef<number>
}

export function useScreenComposable(): ScreenComposable {
  const $q = useQuasar()

  const isMobile = computed(() => $q.screen.width < 700)
  const isTablet = computed(() => $q.screen.width >= 700 && $q.screen.width < 1024)
  const isDesktop = computed(() => $q.screen.width >= 1024)

  return {
    isMobile,
    isTablet,
    isDesktop,
    width: computed(() => $q.screen.width),
    height: computed(() => $q.screen.height)
  }
}
