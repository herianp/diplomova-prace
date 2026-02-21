<template>
  <div>
    <!-- Filters -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-5">
        <q-select
          v-model="selectedTeamId"
          :options="teamOptions"
          :label="$t('admin.audit.selectTeam')"
          emit-value
          map-options
          dense
          outlined
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-select
          v-model="selectedOperation"
          :options="operationOptions"
          :label="$t('admin.audit.operation')"
          emit-value
          map-options
          dense
          outlined
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-btn
          :label="$t('admin.audit.load')"
          color="primary"
          :loading="isLoading"
          :disable="!selectedTeamId"
          @click="loadLogs"
          class="full-width"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center q-pa-xl">
      <q-spinner size="3em" color="primary" />
    </div>

    <!-- Error -->
    <q-banner v-else-if="loadError" class="bg-negative text-white q-mb-md" rounded>
      {{ $t('admin.audit.loadError') }}: {{ loadError }}
    </q-banner>

    <!-- Empty state -->
    <q-banner v-else-if="hasLoaded && auditLogs.length === 0" class="bg-grey-2 q-mb-md" rounded>
      {{ $t('admin.audit.noLogs') }}
    </q-banner>

    <!-- Table -->
    <q-table
      v-else-if="auditLogs.length > 0"
      :rows="auditLogs"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[10, 25, 50]"
      flat
      bordered
    >
      <template v-slot:body-cell-operation="props">
        <q-td :props="props">
          <q-badge :color="operationColor(props.row.operation)">
            {{ operationLabel(props.row.operation) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-entity="props">
        <q-td :props="props">
          <span class="text-weight-medium">{{ props.row.entityType }}</span>
          <span class="text-grey q-ml-xs">{{ props.row.entityId }}</span>
        </q-td>
      </template>

      <template v-slot:body-cell-details="props">
        <q-td :props="props">
          <div v-if="props.row.metadata">
            <div v-for="(value, key) in props.row.metadata" :key="key" class="text-caption">
              <span class="text-weight-medium">{{ key }}:</span> {{ value }}
            </div>
          </div>
          <span v-else class="text-grey">—</span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { useAuditLogFirebase } from '@/services/auditLogFirebase'

const props = defineProps({
  filteredTeams: { type: Array, required: true },
})

const { t } = useI18n()
const { getAuditLogs } = useAuditLogFirebase()

const selectedTeamId = ref(null)
const selectedOperation = ref(null)
const isLoading = ref(false)
const loadError = ref(null)
const hasLoaded = ref(false)
const auditLogs = ref([])

const teamOptions = computed(() =>
  props.filteredTeams.map((team) => ({
    label: team.name,
    value: team.id,
  }))
)

const OPERATIONS = [
  'survey.create',
  'survey.update',
  'survey.delete',
  'fine.create',
  'fine.update',
  'fine.delete',
  'member.remove',
  'vote.verify',
]

const operationOptions = computed(() => [
  { label: t('admin.audit.allOperations'), value: null },
  ...OPERATIONS.map((op) => ({
    label: t(`admin.audit.op.${op.replace('.', '_')}`),
    value: op,
  })),
])

const columns = computed(() => [
  {
    name: 'timestamp',
    label: t('admin.audit.dateTime'),
    field: (row) => row.timestamp,
    format: (val) => {
      if (!val) return '—'
      const dt = val.toDate ? DateTime.fromJSDate(val.toDate()) : DateTime.fromJSDate(val)
      return dt.toFormat('dd.MM.yyyy HH:mm')
    },
    align: 'left',
    sortable: true,
  },
  {
    name: 'operation',
    label: t('admin.audit.operation'),
    field: 'operation',
    align: 'left',
    sortable: true,
  },
  {
    name: 'actor',
    label: t('admin.audit.actor'),
    field: 'actorDisplayName',
    align: 'left',
    sortable: true,
  },
  {
    name: 'entity',
    label: t('admin.audit.entity'),
    field: 'entityType',
    align: 'left',
  },
  {
    name: 'details',
    label: t('admin.audit.details'),
    field: 'metadata',
    align: 'left',
  },
])

const operationColor = (op) => {
  const colors = {
    'survey.create': 'positive',
    'survey.update': 'info',
    'survey.delete': 'negative',
    'fine.create': 'warning',
    'fine.update': 'info',
    'fine.delete': 'negative',
    'member.remove': 'negative',
    'vote.verify': 'positive',
  }
  return colors[op] || 'grey'
}

const operationLabel = (op) => {
  const key = `admin.audit.op.${op.replace('.', '_')}`
  return t(key)
}


const loadLogs = async () => {
  if (!selectedTeamId.value) return
  isLoading.value = true
  loadError.value = null
  hasLoaded.value = false

  try {
    const filters = { limitCount: 50 }
    if (selectedOperation.value) {
      filters.operation = selectedOperation.value
    }
    auditLogs.value = await getAuditLogs(selectedTeamId.value, filters)
    hasLoaded.value = true
  } catch (error) {
    loadError.value = error.message || String(error)
  } finally {
    isLoading.value = false
  }
}
</script>
