<template>
  <div>
    <q-input
      v-model="teamSearchQuery"
      :placeholder="$t('admin.searchTeams')"
      dense
      outlined
      clearable
      class="q-mb-md"
    >
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-table
      :rows="filteredTeams"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[10, 25, 50]"
      :no-data-label="$t('admin.noTeams')"
      flat
      bordered
    >
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <q-avatar size="32px" color="primary" text-color="white" class="q-mr-sm">
              {{ (props.row.name || '?')[0].toUpperCase() }}
            </q-avatar>
            <span class="text-weight-medium">{{ props.row.name }}</span>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-members="props">
        <q-td :props="props">
          {{ props.row.members?.length || 0 }}
        </q-td>
      </template>

      <template v-slot:body-cell-powerUsers="props">
        <q-td :props="props">
          {{ props.row.powerusers?.length || 0 }}
        </q-td>
      </template>

      <template v-slot:body-cell-surveys="props">
        <q-td :props="props">
          {{ teamSurveysCount.get(props.row.id) || 0 }}
        </q-td>
      </template>

      <template v-slot:body-cell-creator="props">
        <q-td :props="props">
          {{ getCreatorName(props.row.creator) }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            icon="visibility"
            color="primary"
            :title="$t('admin.viewTeam')"
            @click="viewTeam(props.row.id)"
          />
          <q-btn
            flat
            dense
            icon="delete"
            color="negative"
            :title="$t('admin.deleteTeam')"
            @click="confirmDelete(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Delete confirmation dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $t('admin.deleteTeam') }}</div>
        </q-card-section>
        <q-card-section>
          <p>{{ $t('admin.confirmDeleteTeam') }}</p>
          <q-input
            v-model="deleteConfirmName"
            :label="teamToDelete?.name"
            dense
            outlined
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn
            flat
            :label="$t('common.delete')"
            color="negative"
            :disable="deleteConfirmName !== teamToDelete?.name"
            :loading="isDeleting"
            @click="executeDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  filteredTeams: { type: Array, required: true },
  teamSearchQuery: { type: String, required: true },
  teamSurveysCount: { type: Map, required: true },
  getCreatorName: { type: Function, required: true },
})

const emit = defineEmits(['update:teamSearchQuery', 'deleteTeam'])

const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()

const teamSearchQuery = computed({
  get: () => props.teamSearchQuery,
  set: (val) => emit('update:teamSearchQuery', val),
})

const showDeleteDialog = ref(false)
const teamToDelete = ref(null)
const deleteConfirmName = ref('')
const isDeleting = ref(false)

import { computed } from 'vue'

const columns = computed(() => [
  { name: 'name', label: t('admin.teamName'), field: 'name', align: 'left', sortable: true },
  { name: 'members', label: t('admin.members'), field: (row) => row.members?.length || 0, align: 'center', sortable: true },
  { name: 'powerUsers', label: t('admin.powerUsers'), field: (row) => row.powerusers?.length || 0, align: 'center', sortable: true },
  { name: 'surveys', label: t('admin.surveys'), align: 'center', sortable: true },
  { name: 'creator', label: t('admin.creator'), field: 'creator', align: 'left', sortable: true },
  { name: 'actions', label: t('admin.actions'), align: 'center' },
])

const viewTeam = (teamId) => {
  router.push(`/team/${teamId}`)
}

const confirmDelete = (team) => {
  teamToDelete.value = team
  deleteConfirmName.value = ''
  showDeleteDialog.value = true
}

const executeDelete = async () => {
  if (!teamToDelete.value) return
  isDeleting.value = true
  try {
    emit('deleteTeam', teamToDelete.value.id)
    showDeleteDialog.value = false
    $q.notify({ type: 'positive', message: t('admin.deleteSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('admin.deleteError') })
  } finally {
    isDeleting.value = false
  }
}
</script>
