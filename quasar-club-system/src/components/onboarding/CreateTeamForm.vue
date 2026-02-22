<template>
  <div>
    <q-input
      v-model="teamName"
      :label="$t('onboarding.teamChoice.createTeam.teamNameLabel')"
      :hint="$t('onboarding.teamChoice.createTeam.teamNameHint')"
      :rules="[val => !!val.trim() || $t('onboarding.teamChoice.createTeam.nameRequired')]"
      outlined
      class="q-mb-md"
      @keyup.enter="handleSubmit"
    />
    <div>
      <q-btn
        color="primary"
        :label="$t('onboarding.teamChoice.createTeam.submitButton')"
        :loading="isCreating"
        :disable="!teamName.trim() || isLimited"
        class="full-width"
        @click="handleSubmit"
      />
      <q-tooltip v-if="isLimited">{{ limitInfo }}</q-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRateLimiter } from '@/composable/useRateLimiter'

defineProps({
  isCreating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit'])

const teamName = ref('')

const { useActionLimitStatus } = useRateLimiter()
const { isLimited, limitInfo } = useActionLimitStatus('teamCreation')

const handleSubmit = () => {
  if (!teamName.value.trim()) return
  if (isLimited.value) return
  emit('submit', teamName.value.trim())
}
</script>
