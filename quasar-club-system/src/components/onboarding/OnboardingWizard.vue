<template>
  <q-page class="flex flex-center" style="min-height: inherit">
    <!-- Success screen (shown after team gained) -->
    <div v-if="showSuccess" class="text-center">
      <q-icon name="check_circle" color="positive" size="80px" />
      <div class="text-h5 q-mt-md">{{ $t('onboarding.success.title') }}</div>
      <div class="text-body1 q-mt-sm text-grey-7">{{ $t('onboarding.success.subtitle') }}</div>
      <q-btn color="primary" :label="$t('onboarding.success.goToDashboard')" @click="goToDashboard" class="q-mt-lg" size="lg" />
    </div>

    <!-- Wizard stepper -->
    <q-stepper v-else v-model="currentStep" animated flat bordered style="max-width: 600px; width: 100%">

      <!-- Step 1: Welcome -->
      <q-step :name="1" :title="$t('onboarding.welcome.title')" icon="waving_hand" :done="currentStep > 1">
        <div class="step-content text-center q-py-md">
          <q-icon name="sports_soccer" size="64px" color="primary" class="q-mb-md" />
          <div class="text-h5 q-mb-md">{{ $t('onboarding.welcome.heading') }}</div>
          <div class="text-body1 text-grey-7 q-mb-lg">{{ $t('onboarding.welcome.description') }}</div>

          <!-- Feature highlights: 3 icons with labels -->
          <div class="row justify-center q-gutter-md q-mb-md">
            <div class="col-auto text-center" style="width: 120px">
              <q-icon name="how_to_vote" size="36px" color="primary" />
              <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature1') }}</div>
            </div>
            <div class="col-auto text-center" style="width: 120px">
              <q-icon name="bar_chart" size="36px" color="primary" />
              <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature2') }}</div>
            </div>
            <div class="col-auto text-center" style="width: 120px">
              <q-icon name="groups" size="36px" color="primary" />
              <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature3') }}</div>
            </div>
          </div>
        </div>
        <q-stepper-navigation>
          <q-btn color="primary" :label="$t('onboarding.next')" @click="nextStep" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Display Name -->
      <q-step :name="2" :title="$t('onboarding.displayName.title')" icon="person" :done="currentStep > 2">
        <div class="step-content q-py-md">
          <div class="text-body1 q-mb-md">{{ $t('onboarding.displayName.description') }}</div>
          <q-input
            v-model="displayName"
            :label="$t('onboarding.displayName.label')"
            :hint="$t('onboarding.displayName.hint')"
            outlined
            class="q-mb-md"
          />
        </div>
        <q-stepper-navigation>
          <q-btn color="primary" :label="$t('onboarding.next')" @click="nextStep" :loading="isLoading" />
          <q-btn flat :label="$t('onboarding.back')" @click="prevStep" class="q-ml-sm" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 3: Team Choice -->
      <q-step :name="3" :title="$t('onboarding.teamChoice.title')" icon="group_add">
        <div class="step-content q-py-md">
          <!-- Card selection (shown when no path selected) -->
          <div v-if="!teamChoicePath" class="row q-gutter-md justify-center">
            <q-card
              clickable
              @click="selectTeamPath('create')"
              class="col-12 col-sm-5 cursor-pointer"
              bordered
            >
              <q-card-section class="text-center q-pa-lg">
                <q-icon name="add_circle" size="48px" color="primary" />
                <div class="text-h6 q-mt-sm">{{ $t('onboarding.teamChoice.createTitle') }}</div>
                <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('onboarding.teamChoice.createDescription') }}</div>
              </q-card-section>
            </q-card>
            <q-card
              clickable
              @click="selectTeamPath('browse')"
              class="col-12 col-sm-5 cursor-pointer"
              bordered
            >
              <q-card-section class="text-center q-pa-lg">
                <q-icon name="search" size="48px" color="primary" />
                <div class="text-h6 q-mt-sm">{{ $t('onboarding.teamChoice.browseTitle') }}</div>
                <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('onboarding.teamChoice.browseDescription') }}</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Inline Create Team form (placeholder for Phase 11) -->
          <div v-else-if="teamChoicePath === 'create'">
            <q-banner class="bg-info text-white rounded-borders">
              <template v-slot:avatar><q-icon name="info" /></template>
              {{ $t('onboarding.teamChoice.createPlaceholder') }}
            </q-banner>
          </div>

          <!-- Inline Browse Teams list (placeholder for Phase 12) -->
          <div v-else-if="teamChoicePath === 'browse'">
            <q-banner class="bg-info text-white rounded-borders">
              <template v-slot:avatar><q-icon name="info" /></template>
              {{ $t('onboarding.teamChoice.browsePlaceholder') }}
            </q-banner>
          </div>
        </div>
        <q-stepper-navigation>
          <q-btn flat :label="$t('onboarding.back')" @click="teamChoicePath ? backToCardSelection() : prevStep()" />
        </q-stepper-navigation>
      </q-step>

    </q-stepper>
  </q-page>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useOnboardingComposable } from '@/composable/useOnboardingComposable'
import { useTeamStore } from '@/stores/teamStore'

const {
  currentStep,
  displayName,
  isLoading,
  teamChoicePath,
  showSuccess,
  initDisplayName,
  selectTeamPath,
  backToCardSelection,
  goToDashboard,
  nextStep,
  prevStep
} = useOnboardingComposable()

const teamStore = useTeamStore()

// Pre-fill display name from Firebase Auth
initDisplayName()

// Watch for team membership — show success screen when user gains a team
watch(
  () => teamStore.teams.length,
  (newLength) => {
    if (newLength > 0) {
      showSuccess.value = true
    }
  }
)
</script>

<style scoped>
:deep(.q-stepper__content.q-panel-parent) {
  min-height: 450px;
}

:deep(.q-stepper__step-content) {
  height: 100%;
}

:deep(.q-stepper__step-inner) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.step-content {
  flex: 1;
}
</style>
