<template>
  <div>
    <q-input
      v-model="userSearchQuery"
      :placeholder="$t('admin.searchUsers')"
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
          <span class="text-weight-medium">{{ props.row.displayName || props.row.name || '-' }}</span>
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
})

const emit = defineEmits(['update:userSearchQuery'])

const { t } = useI18n()

const userSearchQuery = computed({
  get: () => props.userSearchQuery,
  set: (val) => emit('update:userSearchQuery', val),
})

const columns = computed(() => [
  { name: 'displayName', label: t('admin.displayName'), field: (row) => row.displayName || row.name || '', align: 'left', sortable: true },
  { name: 'email', label: t('admin.email'), field: 'email', align: 'left', sortable: true },
  { name: 'createdAt', label: t('admin.createdAt'), field: 'createdAt', align: 'left', sortable: true },
  { name: 'teamsCount', label: t('admin.teamsCount'), align: 'center', sortable: true },
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
