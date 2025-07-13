<template>
  <div class="survey-filter-menu">
    <q-expansion-item
      v-model="expanded"
      icon="filter_list"
      :label="$t('survey.filters.title')"
      :header-class="'bg-primary text-white'"
      class="filter-expansion"
    >
      <q-card flat class="filter-card">
        <q-card-section class="q-pa-md">
          <!-- Search by Name -->
          <div class="filter-row q-mb-md">
            <q-input
              v-model="localFilters.searchName"
              :label="$t('survey.filters.searchByName')"
              outlined
              dense
              clearable
              :placeholder="$t('survey.filters.searchPlaceholder')"
              @update:model-value="onFilterChange"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Quick Date Filters -->
          <div class="filter-row q-mb-md">
            <div class="text-subtitle2 q-mb-sm">{{ $t('reports.quickFilters') }}</div>
            <div class="row q-gutter-xs">
              <q-btn
                v-for="preset in datePresets"
                :key="preset.key"
                :label="preset.label"
                size="sm"
                outline
                color="primary"
                @click="applyDatePreset(preset)"
                dense
                class="col-auto"
              />
            </div>
          </div>

          <!-- Date Range Picker -->
          <div class="filter-row q-mb-md">
            <div class="text-subtitle2 q-mb-sm">{{ $t('survey.filters.customRange') }}</div>
            <div class="row q-gutter-md">
              <div class="col-12 col-md">
                <q-input
                  v-model="localFilters.dateFrom"
                  :label="$t('survey.filters.dateFrom')"
                  outlined
                  dense
                  clearable
                  readonly
                  @click="showDateFromPicker = true"
                >
                  <template v-slot:prepend>
                    <q-icon name="event" />
                  </template>
                  <template v-slot:append>
                    <q-icon name="calendar_today" class="cursor-pointer" @click="showDateFromPicker = true" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md">
                <q-input
                  v-model="localFilters.dateTo"
                  :label="$t('survey.filters.dateTo')"
                  outlined
                  dense
                  clearable
                  readonly
                  @click="showDateToPicker = true"
                >
                  <template v-slot:prepend>
                    <q-icon name="event" />
                  </template>
                  <template v-slot:append>
                    <q-icon name="calendar_today" class="cursor-pointer" @click="showDateToPicker = true" />
                  </template>
                </q-input>
              </div>
            </div>
          </div>


          <!-- Action Buttons -->
          <div class="filter-actions q-mt-md">
            <q-btn
              flat
              :label="$t('survey.filters.clear')"
              color="grey-7"
              icon="clear"
              @click="clearFilters"
              class="q-mr-sm"
            />
            <q-btn
              :label="$t('survey.filters.apply')"
              color="primary"
              icon="check"
              @click="applyFilters"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- Date From Picker Dialog -->
    <q-dialog v-model="showDateFromPicker">
      <q-date
        v-model="tempDateFrom"
        mask="YYYY-MM-DD"
        @update:model-value="onDateFromSelect"
      >
        <div class="row items-center justify-end q-gutter-sm">
          <q-btn v-close-popup :label="$t('survey.filters.cancel')" color="grey-7" flat />
          <q-btn v-close-popup :label="$t('survey.filters.ok')" color="primary" @click="setDateFrom" />
        </div>
      </q-date>
    </q-dialog>

    <!-- Date To Picker Dialog -->
    <q-dialog v-model="showDateToPicker">
      <q-date
        v-model="tempDateTo"
        mask="YYYY-MM-DD"
        @update:model-value="onDateToSelect"
      >
        <div class="row items-center justify-end q-gutter-sm">
          <q-btn v-close-popup :label="$t('survey.filters.cancel')" color="grey-7" flat />
          <q-btn v-close-popup :label="$t('survey.filters.ok')" color="primary" @click="setDateTo" />
        </div>
      </q-date>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'

const { t } = useI18n()

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      searchName: '',
      dateFrom: '',
      dateTo: ''
    })
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'filtersChanged'])

// State
const expanded = ref(false)
const showDateFromPicker = ref(false)
const showDateToPicker = ref(false)
const tempDateFrom = ref('')
const tempDateTo = ref('')

const localFilters = reactive({
  searchName: props.modelValue.searchName || '',
  dateFrom: props.modelValue.dateFrom || '',
  dateTo: props.modelValue.dateTo || ''
})

// Date presets
const datePresets = computed(() => [
  {
    key: 'season',
    label: t('reports.thisSeason'),
    from: '2025-07-13',
    to: DateTime.now().toISODate()
  },
  {
    key: 'thisMonth',
    label: t('reports.thisMonth'),
    from: DateTime.now().startOf('month').toISODate(),
    to: DateTime.now().toISODate()
  },
  {
    key: 'lastMonth',
    label: t('reports.lastMonth'),
    from: DateTime.now().minus({ months: 1 }).startOf('month').toISODate(),
    to: DateTime.now().minus({ months: 1 }).endOf('month').toISODate()
  },
  {
    key: 'thisWeek',
    label: t('reports.thisWeek'),
    from: DateTime.now().startOf('week').toISODate(),
    to: DateTime.now().toISODate()
  },
  {
    key: 'lastWeek',
    label: t('reports.lastWeek'),
    from: DateTime.now().minus({ weeks: 1 }).startOf('week').toISODate(),
    to: DateTime.now().minus({ weeks: 1 }).endOf('week').toISODate()
  }
])

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  Object.assign(localFilters, newValue)
}, { deep: true })

// Methods
const onFilterChange = () => {
  // Auto-apply filters for immediate feedback
  emit('update:modelValue', { ...localFilters })
  emit('filtersChanged', { ...localFilters })
}

const onDateFromSelect = (date) => {
  tempDateFrom.value = date
}

const onDateToSelect = (date) => {
  tempDateTo.value = date
}

const setDateFrom = () => {
  localFilters.dateFrom = tempDateFrom.value
  onFilterChange()
}

const setDateTo = () => {
  localFilters.dateTo = tempDateTo.value
  onFilterChange()
}

const applyDatePreset = (preset) => {
  localFilters.dateFrom = preset.from
  localFilters.dateTo = preset.to
  onFilterChange()
}

const clearFilters = () => {
  localFilters.searchName = ''
  localFilters.dateFrom = ''
  localFilters.dateTo = ''
  tempDateFrom.value = ''
  tempDateTo.value = ''
  onFilterChange()
}

const applyFilters = () => {
  expanded.value = false
  emit('update:modelValue', { ...localFilters })
  emit('filtersChanged', { ...localFilters })
}
</script>

<style scoped>
.survey-filter-menu {
  margin-bottom: 1rem;
}

.filter-expansion {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.filter-card {
  background: #f9f9f9;
}

.filter-row {
  width: 100%;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.q-ml-lg {
  margin-left: 2rem;
}

@media (max-width: 768px) {
  .q-ml-lg {
    margin-left: 1rem;
  }
  
  .filter-actions {
    justify-content: center;
  }
}
</style>