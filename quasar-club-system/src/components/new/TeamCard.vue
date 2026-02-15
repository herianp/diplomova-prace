<template>
  <q-card
    flat
    bordered
    class="team-card cursor-pointer"
    :class="{ 'team-card--active': isActive }"
    @click="selectTeam"
  >
    <q-card-section class="q-pa-md">
      <div class="row items-center no-wrap q-mb-sm">
        <q-avatar size="40px" :color="avatarColor" text-color="white" class="q-mr-sm">
          <span class="text-weight-bold" style="font-size: 1.1rem;">{{ teamInitial }}</span>
        </q-avatar>
        <div class="col" style="min-width: 0;">
          <div class="text-subtitle1 text-weight-medium ellipsis">{{ team.name }}</div>
          <q-chip
            :color="isPowerUser ? 'positive' : 'grey-4'"
            :text-color="isPowerUser ? 'white' : 'grey-8'"
            size="xs"
            dense
            :icon="isPowerUser ? 'shield' : 'person'"
            :label="isPowerUser ? $t('dashboard.powerUser') : $t('dashboard.member')"
          />
        </div>
        <q-btn
          v-if="isPowerUser"
          flat
          round
          dense
          icon="settings"
          color="grey-7"
          size="sm"
          @click.stop="manageTeam"
        >
          <q-tooltip>{{ $t('team.manage') }}</q-tooltip>
        </q-btn>
      </div>

      <div class="row items-center q-gutter-x-md text-caption text-grey-7">
        <div class="row items-center no-wrap">
          <q-icon name="group" size="16px" class="q-mr-xs" />
          <span>{{ team.members?.length || 0 }} {{ $t('team.members') }}</span>
        </div>
        <div class="row items-center no-wrap">
          <q-icon name="shield" size="16px" class="q-mr-xs" />
          <span>{{ team.powerusers?.length || 0 }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import { listenerRegistry } from '@/services/listenerRegistry'

const router = useRouter()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const { setSurveysListener } = useSurveyUseCases()

const props = defineProps({
  team: {
    type: Object,
    required: true
  }
})

const isActive = computed(() => teamStore.currentTeam?.id === props.team.id)

const isPowerUser = computed(() =>
  props.team.powerusers?.includes(authStore.user?.uid)
)

const teamInitial = computed(() =>
  props.team.name ? props.team.name.charAt(0).toUpperCase() : '?'
)

const avatarColors = ['primary', 'secondary', 'accent', 'positive', 'info', 'deep-purple', 'teal', 'indigo']
const avatarColor = computed(() => {
  const index = props.team.name
    ? props.team.name.charCodeAt(0) % avatarColors.length
    : 0
  return avatarColors[index]
})

const selectTeam = () => {
  // Clean up all team-scoped listeners before switching
  listenerRegistry.unregisterByScope('team')

  teamStore.setCurrentTeam(props.team)
  setSurveysListener(props.team.id)
}

const manageTeam = () => {
  router.push(`/team/${props.team.id}`)
}
</script>

<style scoped>
.team-card {
  border-left: 3px solid transparent;
  transition: border-color 0.2s ease;
  height: 100%;
}

.team-card--active {
  border-left-color: var(--q-primary);
  background: rgba(25, 118, 210, 0.04);
}
</style>
