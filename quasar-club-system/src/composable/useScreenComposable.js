import { computed } from 'vue'
import { useQuasar } from 'quasar'

export function useScreenComposable() {
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
