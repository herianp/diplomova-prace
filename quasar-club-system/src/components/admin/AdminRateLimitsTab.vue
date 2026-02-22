<template>
  <div class="q-pa-md">
    <!-- Loading state -->
    <div v-if="!rateLimitStore.isLoaded" class="text-center q-pa-xl">
      <q-spinner size="3em" color="primary" />
    </div>

    <template v-else>
      <q-table
        flat
        :rows="tableRows"
        :columns="columns"
        row-key="key"
        hide-bottom
        :rows-per-page-options="[0]"
      >
        <!-- Limit cell: input when editing, text otherwise -->
        <template #body-cell-limit="props">
          <q-td :props="props">
            <template v-if="editingKey === props.row.key">
              <q-input
                v-model.number="editValue"
                type="number"
                :min="1"
                dense
                autofocus
                style="width: 100px"
                @keyup.enter="saveEdit(props.row.key)"
                @keyup.escape="cancelEdit"
              >
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    icon="check"
                    color="positive"
                    :loading="isSaving"
                    @click="saveEdit(props.row.key)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    color="negative"
                    @click="cancelEdit"
                  />
                </template>
              </q-input>
            </template>
            <template v-else>
              {{ props.row.limit }}
            </template>
          </q-td>
        </template>

        <!-- Edit action column -->
        <template #body-cell-edit="props">
          <q-td :props="props" auto-width>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              :disable="editingKey !== null && editingKey !== props.row.key"
              @click="startEdit(props.row.key, props.row.limit)"
            />
          </q-td>
        </template>
      </q-table>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRateLimitUseCases } from '@/composable/useRateLimitUseCases'
import { useRateLimitStore } from '@/stores/rateLimitStore'

const $q = useQuasar()
const { t } = useI18n()

const rateLimitUseCases = useRateLimitUseCases()
const rateLimitStore = useRateLimitStore()

// Editing state
const editingKey = ref(null)
const editValue = ref(0)
const isSaving = ref(false)

// Static metadata for each rate-limited action
const actionMeta = [
  { key: 'teamCreation', labelKey: 'admin.rateLimits.teamCreation', windowKey: 'admin.rateLimits.windowTotal' },
  { key: 'messages', labelKey: 'admin.rateLimits.messages', windowKey: 'admin.rateLimits.windowWeekly' },
  { key: 'joinRequests', labelKey: 'admin.rateLimits.joinRequests', windowKey: 'admin.rateLimits.windowPending' },
  { key: 'surveys', labelKey: 'admin.rateLimits.surveys', windowKey: 'admin.rateLimits.windowWeekly' },
  { key: 'fines', labelKey: 'admin.rateLimits.fines', windowKey: 'admin.rateLimits.windowDaily' },
]

// Build table rows from store config + static metadata
const tableRows = computed(() => {
  const cfg = rateLimitStore.config
  if (!cfg) return []
  return actionMeta.map((meta) => ({
    key: meta.key,
    label: t(meta.labelKey),
    limit: cfg[meta.key],
    window: t(meta.windowKey),
  }))
})

const columns = computed(() => [
  {
    name: 'label',
    label: t('admin.rateLimits.actionColumn'),
    field: 'label',
    align: 'left',
  },
  {
    name: 'limit',
    label: t('admin.rateLimits.limitColumn'),
    field: 'limit',
    align: 'left',
  },
  {
    name: 'window',
    label: t('admin.rateLimits.windowColumn'),
    field: 'window',
    align: 'left',
  },
  {
    name: 'edit',
    label: t('admin.rateLimits.editColumn'),
    field: 'edit',
    align: 'center',
  },
])

const startEdit = (key, currentValue) => {
  editingKey.value = key
  editValue.value = currentValue
}

const cancelEdit = () => {
  editingKey.value = null
  editValue.value = 0
}

const saveEdit = async (key) => {
  if (editValue.value <= 0) return
  isSaving.value = true
  try {
    await rateLimitUseCases.updateLimit(key, editValue.value)
    $q.notify({ type: 'positive', message: t('admin.rateLimits.saveSuccess') })
    editingKey.value = null
    editValue.value = 0
  } catch {
    $q.notify({ type: 'negative', message: t('admin.rateLimits.saveError') })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  rateLimitUseCases.startConfigListener()
})
</script>
