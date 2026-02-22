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
    <q-btn
      color="primary"
      :label="$t('onboarding.teamChoice.createTeam.submitButton')"
      :loading="isCreating"
      :disable="!teamName.trim()"
      class="full-width"
      @click="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isCreating: boolean
}>()

const emit = defineEmits<{
  submit: [teamName: string]
}>()

const teamName = ref('')

const handleSubmit = () => {
  if (!teamName.value.trim()) return
  emit('submit', teamName.value.trim())
}
</script>
