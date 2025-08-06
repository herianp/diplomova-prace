<template>
  <div class="survey-create-menu" v-if="isPowerUser">
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

          <!-- Survey Form -->
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
import { useTeamComposable } from '@/composable/useTeamComposable.js'
import { useAuthComposable } from '@/composable/useAuthComposable.js'

defineProps({
  isPowerUser: {
    type: Boolean,
    default: false
  }
})

const expanded = ref(false)
const isSubmitting = ref(false)
const { createTeam } = useTeamComposable()
const { currentUser } = useAuthComposable()

async function handleCreateTeam(payload) {
  try {
    await createTeam(payload.title, currentUser.value.uid);
  } catch (err) {
    console.log(`err ${err}`);
  }
}

const handleCancel = () => {
  expanded.value = false
}
</script>

<style scoped>
.survey-create-menu {
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

.survey-create-menu .q-expansion-item__header {
  padding: 12px 16px;
}

.survey-create-menu .q-expansion-item__content {
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
