<template>
  <OnboardingWizardMobile v-if="$q.screen.lt.sm" />
  <OnboardingWizard v-else />
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard.vue'
import OnboardingWizardMobile from '@/components/onboarding/OnboardingWizardMobile.vue'

const $q = useQuasar()
</script>
