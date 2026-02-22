import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useAuthFirebase } from '@/services/authFirebase'
import { useAuthUseCases } from '@/composable/useAuthUseCases'
import { useTeamUseCases } from '@/composable/useTeamUseCases'
import { RouteEnum } from '@/enums/routesEnum'

export function useOnboardingComposable() {
  const authStore = useAuthStore()
  const router = useRouter()

  const currentStep = ref(1)
  const displayName = ref('')
  const isLoading = ref(false)
  const isCreatingTeam = ref(false)
  const teamChoicePath = ref<'create' | 'browse' | null>(null)
  const showSuccess = ref(false)

  const initDisplayName = () => {
    if (authStore.user?.displayName) {
      displayName.value = authStore.user.displayName
    }
  }

  const saveDisplayName = async (): Promise<void> => {
    if (!displayName.value.trim()) {
      return
    }

    const uid = authStore.user?.uid
    if (!uid) return

    isLoading.value = true
    try {
      await useAuthFirebase().updateUserProfile(uid, displayName.value.trim())
      await useAuthUseCases().refreshCurrentUser()
    } finally {
      isLoading.value = false
    }
  }

  const createTeam = async (teamName: string): Promise<void> => {
    const uid = authStore.user?.uid
    if (!uid) return
    isCreatingTeam.value = true
    try {
      await useTeamUseCases().createTeam(teamName, uid)
      // Success is handled by the teamStore.teams watcher in the wizard component
      // which sets showSuccess = true when teams.length > 0
    } finally {
      isCreatingTeam.value = false
    }
  }

  const selectTeamPath = (path: 'create' | 'browse') => {
    teamChoicePath.value = path
  }

  const backToCardSelection = () => {
    teamChoicePath.value = null
  }

  const goToDashboard = async () => {
    await completeOnboarding()
    void router.push(RouteEnum.DASHBOARD.path)
  }

  const completeOnboarding = async () => {
    const uid = authStore.user?.uid
    if (!uid) return
    await useAuthFirebase().setOnboardingCompleted(uid)
    authStore.setOnboardingComplete(true)
  }

  const skipOnboarding = async () => {
    await completeOnboarding()
    void router.push(RouteEnum.TEAM.path)
  }

  const nextStep = async () => {
    if (currentStep.value === 2) {
      await saveDisplayName()
    }
    currentStep.value++
  }

  const prevStep = () => {
    currentStep.value--
  }

  return {
    currentStep,
    displayName,
    isLoading,
    isCreatingTeam,
    teamChoicePath,
    showSuccess,
    initDisplayName,
    saveDisplayName,
    createTeam,
    selectTeamPath,
    backToCardSelection,
    goToDashboard,
    skipOnboarding,
    nextStep,
    prevStep
  }
}
