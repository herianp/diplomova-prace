<template>
  <q-page class="flex flex-center q-pa-sm" style="min-height: inherit">
    <!-- Success screen (shown after team gained) -->
    <div v-if="showSuccess" class="text-center q-pa-md">
      <q-icon name="check_circle" color="positive" size="64px" />
      <div class="text-h5 q-mt-md">{{ $t('onboarding.success.title') }}</div>
      <div class="text-body1 q-mt-sm text-grey-7">{{ $t('onboarding.success.subtitle') }}</div>
      <q-btn color="primary" :label="$t('onboarding.success.goToDashboard')" @click="goToDashboard" class="q-mt-lg" size="lg" />
    </div>

    <!-- Wizard stepper -->
    <q-stepper
      v-else
      v-model="currentStep"
      animated
      flat
      bordered
      class="onboarding-stepper"
    >

      <!-- Step 1: Welcome -->
      <q-step :name="1" :title="$t('onboarding.welcome.title')" icon="waving_hand" :done="currentStep > 1">
        <div class="text-center q-py-sm">
          <q-icon name="sports_soccer" size="56px" color="primary" class="q-mb-sm" />
          <div class="text-h5 q-mb-sm">{{ $t('onboarding.welcome.heading') }}</div>
          <div class="text-body1 text-grey-7 q-mb-md">{{ $t('onboarding.welcome.description') }}</div>

          <!-- Feature highlights: 3 icons with labels -->
          <div class="row justify-center q-gutter-sm q-mb-sm">
            <div class="col-auto text-center" style="min-width: 90px; max-width: 120px">
              <q-icon name="how_to_vote" size="32px" color="primary" />
              <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature1') }}</div>
            </div>
            <div class="col-auto text-center" style="min-width: 90px; max-width: 120px">
              <q-icon name="bar_chart" size="32px" color="primary" />
              <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature2') }}</div>
            </div>
            <div class="col-auto text-center" style="min-width: 90px; max-width: 120px">
              <q-icon name="groups" size="32px" color="primary" />
              <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature3') }}</div>
            </div>
          </div>
        </div>
        <q-stepper-navigation>
          <q-btn color="primary" :label="$t('onboarding.next')" @click="nextStep" class="full-width" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Display Name -->
      <q-step :name="2" :title="$t('onboarding.displayName.title')" icon="person" :done="currentStep > 2">
        <div class="q-py-sm">
          <div class="text-body1 q-mb-md">{{ $t('onboarding.displayName.description') }}</div>
          <q-input
            v-model="displayName"
            :label="$t('onboarding.displayName.label')"
            :hint="$t('onboarding.displayName.hint')"
            outlined
            class="q-mb-md"
          />
        </div>
        <q-stepper-navigation class="row q-gutter-sm">
          <q-btn color="primary" :label="$t('onboarding.next')" @click="nextStep" :loading="isLoading" class="col" />
          <q-btn flat :label="$t('onboarding.back')" @click="prevStep" class="col-auto" />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 3: Team Choice -->
      <q-step :name="3" :title="$t('onboarding.teamChoice.title')" icon="group_add">
        <div class="q-py-sm">
          <!-- Card selection (shown when no path selected) -->
          <div v-if="!teamChoicePath" class="column q-gutter-sm items-center">
            <q-card
              clickable
              @click="selectTeamPath('create')"
              class="cursor-pointer team-choice-card"
              bordered
            >
              <q-card-section class="text-center q-pa-lg">
                <q-icon name="add_circle" size="44px" color="primary" />
                <div class="text-h6 q-mt-sm">{{ $t('onboarding.teamChoice.createTitle') }}</div>
                <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('onboarding.teamChoice.createDescription') }}</div>
              </q-card-section>
            </q-card>
            <q-card
              clickable
              @click="selectTeamPath('browse')"
              class="cursor-pointer team-choice-card"
              bordered
            >
              <q-card-section class="text-center q-pa-lg">
                <q-icon name="search" size="44px" color="primary" />
                <div class="text-h6 q-mt-sm">{{ $t('onboarding.teamChoice.browseTitle') }}</div>
                <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('onboarding.teamChoice.browseDescription') }}</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Inline Create Team form (placeholder for Phase 11) -->
          <div v-else-if="teamChoicePath === 'create'">
            <q-btn flat icon="arrow_back" :label="$t('onboarding.back')" @click="backToCardSelection" class="q-mb-md" />
            <q-banner class="bg-info text-white rounded-borders">
              <template v-slot:avatar><q-icon name="info" /></template>
              {{ $t('onboarding.teamChoice.createPlaceholder') }}
            </q-banner>
          </div>

          <!-- Inline Browse Teams list (placeholder for Phase 12) -->
          <div v-else-if="teamChoicePath === 'browse'">
            <q-btn flat icon="arrow_back" :label="$t('onboarding.back')" @click="backToCardSelection" class="q-mb-md" />
            <q-banner class="bg-info text-white rounded-borders">
              <template v-slot:avatar><q-icon name="info" /></template>
              {{ $t('onboarding.teamChoice.browsePlaceholder') }}
            </q-banner>
          </div>
        </div>
        <q-stepper-navigation>
          <q-btn flat :label="$t('onboarding.back')" @click="prevStep" />
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
.onboarding-stepper {
  max-width: 600px;
  width: 100%;
}

.team-choice-card {
  width: 100%;
  max-width: 280px;
}

@media (min-width: 600px) {
  .team-choice-card {
    max-width: 240px;
  }
}
</style>
