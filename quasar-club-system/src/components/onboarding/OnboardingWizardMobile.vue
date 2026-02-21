<template>
  <q-page class="q-pa-md" style="min-height: inherit">
    <!-- Success screen -->
    <div v-if="showSuccess" class="text-center q-mt-xl">
      <q-icon name="check_circle" color="positive" size="64px" />
      <div class="text-h6 q-mt-md">{{ $t('onboarding.success.title') }}</div>
      <div class="text-body2 q-mt-sm text-grey-7">{{ $t('onboarding.success.subtitle') }}</div>
      <q-btn
        color="primary"
        :label="$t('onboarding.success.goToDashboard')"
        @click="goToDashboard"
        class="q-mt-lg full-width"
        size="lg"
      />
    </div>

    <!-- Mobile wizard — card-based steps (no QStepper) -->
    <div v-else>
      <!-- Step indicator -->
      <div class="row justify-center q-mb-md">
        <div
          v-for="step in 3"
          :key="step"
          class="q-mx-xs"
          :style="{
            width: '32px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: step <= currentStep ? 'var(--q-primary)' : '#e0e0e0'
          }"
        />
      </div>

      <!-- Step 1: Welcome -->
      <div v-if="currentStep === 1" class="text-center">
        <q-icon name="sports_soccer" size="48px" color="primary" class="q-mb-sm" />
        <div class="text-h6 q-mb-xs">{{ $t('onboarding.welcome.heading') }}</div>
        <div class="text-body2 text-grey-7 q-mb-lg">{{ $t('onboarding.welcome.description') }}</div>

        <div class="row justify-center q-gutter-sm q-mb-lg">
          <div class="col-auto text-center" style="width: 90px">
            <q-icon name="how_to_vote" size="28px" color="primary" />
            <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature1') }}</div>
          </div>
          <div class="col-auto text-center" style="width: 90px">
            <q-icon name="bar_chart" size="28px" color="primary" />
            <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature2') }}</div>
          </div>
          <div class="col-auto text-center" style="width: 90px">
            <q-icon name="groups" size="28px" color="primary" />
            <div class="text-caption q-mt-xs">{{ $t('onboarding.welcome.feature3') }}</div>
          </div>
        </div>

        <q-btn color="primary" :label="$t('onboarding.next')" @click="nextStep" class="full-width" size="lg" />
      </div>

      <!-- Step 2: Display Name -->
      <div v-else-if="currentStep === 2">
        <div class="text-h6 q-mb-xs">{{ $t('onboarding.displayName.title') }}</div>
        <div class="text-body2 text-grey-7 q-mb-md">{{ $t('onboarding.displayName.description') }}</div>
        <q-input
          v-model="displayName"
          :label="$t('onboarding.displayName.label')"
          :hint="$t('onboarding.displayName.hint')"
          outlined
          class="q-mb-lg"
        />
        <q-btn
          color="primary"
          :label="$t('onboarding.next')"
          @click="nextStep"
          :loading="isLoading"
          class="full-width q-mb-sm"
          size="lg"
        />
        <q-btn flat :label="$t('onboarding.back')" @click="prevStep" class="full-width" />
      </div>

      <!-- Step 3: Team Choice -->
      <div v-else-if="currentStep === 3">
        <div class="text-h6 q-mb-md">{{ $t('onboarding.teamChoice.title') }}</div>

        <!-- Card selection -->
        <div v-if="!teamChoicePath" class="column q-gutter-sm">
          <q-card clickable @click="selectTeamPath('create')" class="cursor-pointer" bordered>
            <q-card-section class="row items-center q-pa-md">
              <q-icon name="add_circle" size="36px" color="primary" class="q-mr-md" />
              <div>
                <div class="text-subtitle1">{{ $t('onboarding.teamChoice.createTitle') }}</div>
                <div class="text-caption text-grey-7">{{ $t('onboarding.teamChoice.createDescription') }}</div>
              </div>
            </q-card-section>
          </q-card>
          <q-card clickable @click="selectTeamPath('browse')" class="cursor-pointer" bordered>
            <q-card-section class="row items-center q-pa-md">
              <q-icon name="search" size="36px" color="primary" class="q-mr-md" />
              <div>
                <div class="text-subtitle1">{{ $t('onboarding.teamChoice.browseTitle') }}</div>
                <div class="text-caption text-grey-7">{{ $t('onboarding.teamChoice.browseDescription') }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Inline Create Team placeholder -->
        <div v-else-if="teamChoicePath === 'create'">
          <q-btn flat icon="arrow_back" :label="$t('onboarding.back')" @click="backToCardSelection" class="q-mb-md" dense />
          <q-banner class="bg-info text-white rounded-borders">
            <template v-slot:avatar><q-icon name="info" /></template>
            {{ $t('onboarding.teamChoice.createPlaceholder') }}
          </q-banner>
        </div>

        <!-- Inline Browse Teams placeholder -->
        <div v-else-if="teamChoicePath === 'browse'">
          <q-btn flat icon="arrow_back" :label="$t('onboarding.back')" @click="backToCardSelection" class="q-mb-md" dense />
          <q-banner class="bg-info text-white rounded-borders">
            <template v-slot:avatar><q-icon name="info" /></template>
            {{ $t('onboarding.teamChoice.browsePlaceholder') }}
          </q-banner>
        </div>

        <q-btn flat :label="$t('onboarding.back')" @click="prevStep" class="full-width q-mt-md" />
      </div>
    </div>
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

initDisplayName()

watch(
  () => teamStore.teams.length,
  (newLength) => {
    if (newLength > 0) {
      showSuccess.value = true
    }
  }
)
</script>
