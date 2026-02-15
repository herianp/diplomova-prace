<template>
  <div class="team-create-menu" v-if="isPowerUser">
    <q-expansion-item
      v-model="expanded"
      icon="add_circle"
      :label="$t('team.create')"
      :header-class="'bg-positive text-white'"
      class="create-expansion"
    >
      <q-card flat class="create-card">
        <q-card-section class="q-pa-md">
          <div class="create-description q-mb-md">
            <q-icon name="info" color="primary" size="sm" class="q-mr-sm" />
            <span class="text-grey-7">{{ $t('team.create') }}</span>
          </div>

          <TeamForm
            @submit="handleCreateTeam"
            @cancel="handleCancel"
            :loading="isSubmitting"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TeamForm from '@/components/modal/TeamForm.vue'
import { useTeamUseCases } from '@/composable/useTeamUseCases.ts'
import { useAuthComposable } from '@/composable/useAuthComposable.js'
import { createLogger } from 'src/utils/logger'

const log = createLogger('TeamCreateMenu')

defineProps({
  isPowerUser: {
    type: Boolean,
    default: false
  }
})

const expanded = ref(false)
const isSubmitting = ref(false)
const { createTeam } = useTeamUseCases()
const { currentUser } = useAuthComposable()

async function handleCreateTeam(payload) {
  try {
    await createTeam(payload.title, currentUser.value.uid);
  } catch (err) {
    log.error('Failed to create team', {
      error: err instanceof Error ? err.message : String(err),
      title: payload.title,
      userId: currentUser.value.uid
    });
  }
}

const handleCancel = () => {
  expanded.value = false
}
</script>

<style scoped>
.team-create-menu {
  margin-bottom: 1rem;
}

.create-expansion {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.create-card {
  background: #f9f9f9;
}

.create-description {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: rgba(25, 118, 210, 0.1);
  border-radius: 4px;
  font-size: 0.875rem;
}

.team-create-menu :deep(.q-expansion-item__header) {
  padding: 12px 16px;
}

.team-create-menu :deep(.q-expansion-item__content) {
  padding: 0;
}

@media (max-width: 768px) {
  .create-description {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
