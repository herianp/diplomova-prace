<template>
  <div>
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-input
        v-model="userSearchQuery"
        :placeholder="$t('admin.searchUsers')"
        dense
        outlined
        clearable
        class="col"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-toggle
        :model-value="showDeletedUsers"
        @update:model-value="emit('update:showDeletedUsers', $event)"
        :label="$t('admin.showDeletedUsers')"
        dense
      />
    </div>

    <q-table
      :rows="filteredUsers"
      :columns="columns"
      row-key="uid"
      :rows-per-page-options="[10, 25, 50]"
      :no-data-label="$t('admin.noUsers')"
      flat
      bordered
    >
      <template v-slot:body-cell-displayName="props">
        <q-td :props="props">
          <span
            :class="{ 'text-grey-6': props.row.status === 'deleted' }"
            class="text-weight-medium"
          >
            {{ props.row.displayName || props.row.name || '-' }}
            <span v-if="props.row.status === 'deleted'"> ({{ $t('admin.userDeleted') }})</span>
          </span>
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            v-if="props.row.status === 'deleted'"
            color="negative"
            :label="$t('admin.userDeleted')"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-createdAt="props">
        <q-td :props="props">
          {{ formatDate(props.row.createdAt) }}
        </q-td>
      </template>

      <template v-slot:body-cell-teamsCount="props">
        <q-td :props="props">
          {{ userTeamsCount.get(props.row.uid) || 0 }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            icon="delete"
            color="negative"
            :title="$t('admin.deleteUser')"
            :disable="props.row.status === 'deleted'"
            @click="emit('delete-user-clicked', props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  filteredUsers: { type: Array, required: true },
  userSearchQuery: { type: String, required: true },
  userTeamsCount: { type: Map, required: true },
  showDeletedUsers: { type: Boolean, required: true },
  allTeams: { type: Array, required: true },
})

const emit = defineEmits(['update:userSearchQuery', 'update:showDeletedUsers', 'delete-user-clicked'])

const { t } = useI18n()

const userSearchQuery = computed({
  get: () => props.userSearchQuery,
  set: (val) => emit('update:userSearchQuery', val),
})

const columns = computed(() => [
  { name: 'displayName', label: t('admin.displayName'), field: (row) => row.displayName || row.name || '', align: 'left', sortable: true },
  { name: 'email', label: t('admin.email'), field: 'email', align: 'left', sortable: true },
  { name: 'status', label: t('admin.status'), field: 'status', align: 'center', sortable: true },
  { name: 'createdAt', label: t('admin.createdAt'), field: 'createdAt', align: 'left', sortable: true },
  { name: 'teamsCount', label: t('admin.teamsCount'), align: 'center', sortable: true },
  { name: 'actions', label: t('admin.actions'), align: 'center' },
])

const formatDate = (date) => {
  if (!date) return '-'
  // Handle Firestore Timestamp objects
  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString()
  }
  if (date instanceof Date) {
    return date.toLocaleDateString()
  }
  // Handle string dates
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString()
}
</script>
