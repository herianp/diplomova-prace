<template>
  <q-page class="mobile-wizard q-pa-md">
    <!-- Success screen -->
    <div v-if="showSuccess" class="column items-center justify-center" style="flex: 1">
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

    <!-- Mobile wizard — flex layout with pinned buttons -->
    <template v-else>
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

      <!-- Step content area — grows to fill space -->
      <div class="wizard-content">
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
          />
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

          <!-- Inline Create Team form -->
          <div v-else-if="teamChoicePath === 'create'">
            <CreateTeamForm :is-creating="isCreatingTeam" @submit="createTeam" />
          </div>

          <!-- Inline Browse Teams list -->
          <div v-else-if="teamChoicePath === 'browse'">
            <TeamBrowseList />
          </div>
        </div>
      </div>

      <!-- Navigation buttons — always pinned at bottom -->
      <div class="wizard-nav">
        <!-- Step 1 -->
        <q-btn v-if="currentStep === 1" color="primary" :label="$t('onboarding.next')" @click="nextStep" class="full-width" size="lg" />

        <!-- Step 2 -->
        <template v-if="currentStep === 2">
          <q-btn color="primary" :label="$t('onboarding.next')" @click="nextStep" :loading="isLoading" class="full-width q-mb-sm" size="lg" />
          <q-btn flat :label="$t('onboarding.back')" @click="prevStep" class="full-width" />
        </template>

        <!-- Step 3 -->
        <q-btn v-if="currentStep === 3" flat :label="$t('onboarding.back')" @click="teamChoicePath ? backToCardSelection() : prevStep()" class="full-width" />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useOnboardingComposable } from '@/composable/useOnboardingComposable'
import { useTeamStore } from '@/stores/teamStore'
import CreateTeamForm from '@/components/onboarding/CreateTeamForm.vue'
import TeamBrowseList from '@/components/onboarding/TeamBrowseList.vue'

const {
  currentStep,
  displayName,
  isLoading,
  isCreatingTeam,
  teamChoicePath,
  showSuccess,
  initDisplayName,
  createTeam,
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

<style scoped>
.mobile-wizard {
  display: flex;
  flex-direction: column;
  min-height: inherit;
}

.wizard-content {
  flex: 1;
}

.wizard-nav {
  padding-top: 16px;
  padding-bottom: 8px;
}
</style>
