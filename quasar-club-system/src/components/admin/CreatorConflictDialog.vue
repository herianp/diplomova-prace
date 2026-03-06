<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 450px; max-width: 600px">
      <q-card-section>
        <div class="row items-center q-gutter-sm">
          <q-icon name="warning" color="warning" size="28px" />
          <div class="text-h6">{{ $t('admin.creatorConflict.title') }}</div>
        </div>
      </q-card-section>

      <q-card-section>
        <p class="text-body2 q-mb-md">
          {{ $t('admin.creatorConflict.description', { count: affectedTeams.length }) }}
        </p>

        <div v-for="(team, index) in affectedTeams" :key="team.id" class="q-mb-md">
          <div class="text-weight-bold q-mb-xs">{{ team.name }}</div>

          <q-select
            v-model="resolutions[index].action"
            :options="actionOptions"
            dense
            outlined
            emit-value
            map-options
            class="q-mb-xs"
          />

          <q-select
            v-if="resolutions[index].action === 'reassign'"
            v-model="resolutions[index].newCreatorUid"
            :options="getMemberOptions(team)"
            dense
            outlined
            emit-value
            map-options
            :label="$t('admin.creatorConflict.selectNewCreator')"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="$t('common.cancel')" v-close-popup />
        <q-btn
          flat
          :label="$t('admin.creatorConflict.confirmDelete')"
          color="negative"
          :disable="!allResolved"
          @click="handleConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null },
  affectedTeams: { type: Array, required: true },
  allUsers: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()

const actionOptions = computed(() => [
  { label: t('admin.creatorConflict.deleteTeamOption'), value: 'delete' },
  { label: t('admin.creatorConflict.reassignCreatorOption'), value: 'reassign' },
])

const resolutions = ref([])

// Reset resolutions when dialog opens or affected teams change
watch(
  () => [props.modelValue, props.affectedTeams],
  () => {
    if (props.modelValue && props.affectedTeams.length > 0) {
      resolutions.value = props.affectedTeams.map((team) => ({
        teamId: team.id,
        action: 'delete',
        newCreatorUid: null,
      }))
    }
  },
  { immediate: true }
)

const getMemberOptions = (team) => {
  if (!team.members) return []
  return team.members
    .filter((uid) => uid !== props.user?.uid)
    .map((uid) => {
      const user = props.allUsers.find((u) => u.uid === uid)
      return {
        label: user?.displayName || user?.name || user?.email || uid,
        value: uid,
      }
    })
}

const allResolved = computed(() => {
  return resolutions.value.every((r) => {
    if (r.action === 'reassign') return !!r.newCreatorUid
    return true
  })
})

const handleConfirm = () => {
  emit('confirm', resolutions.value.map((r) => ({
    teamId: r.teamId,
    action: r.action,
    ...(r.action === 'reassign' && r.newCreatorUid ? { newCreatorUid: r.newCreatorUid } : {}),
  })))
  emit('update:modelValue', false)
}
</script>
