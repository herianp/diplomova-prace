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
                :outline="activePresetKey !== preset.key"
                :unelevated="activePresetKey === preset.key"
                :color="activePresetKey === preset.key ? 'primary' : 'primary'"
                :text-color="activePresetKey === preset.key ? 'white' : undefined"
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
        :navigation-min-year-month="seasonNavMin"
        :navigation-max-year-month="seasonNavMax"
        :options="dateFromOptions"
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
        :navigation-min-year-month="seasonNavMin"
        :navigation-max-year-month="seasonNavMax"
        :options="dateToOptions"
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
import { useDateHelpers } from '@/composable/useDateHelpers'
import { useSeasonStore } from '@/stores/seasonStore'

const { t } = useI18n()
const { getDatePresets } = useDateHelpers()
const seasonStore = useSeasonStore()

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
const activePresetKey = ref('')

const localFilters = reactive({
  searchName: props.modelValue.searchName || '',
  dateFrom: props.modelValue.dateFrom || '',
  dateTo: props.modelValue.dateTo || ''
})

// Date presets using the new helper
const datePresets = computed(() => {
  const season = seasonStore.activeSeason
  return getDatePresets(t).filter(p => {
    // Hide presets that fall entirely outside the active season
    return p.to >= season.startDate && p.from <= season.endDate
  })
})

// Season boundary constraints for date pickers
const seasonNavMin = computed(() => {
  const s = seasonStore.activeSeason.startDate
  return s.substring(0, 7).replace('-', '/')
})
const seasonNavMax = computed(() => {
  const s = seasonStore.activeSeason.endDate
  return s.substring(0, 7).replace('-', '/')
})
const dateFromOptions = (date) => {
  const season = seasonStore.activeSeason
  return date >= season.startDate && date <= season.endDate
}
const dateToOptions = (date) => {
  const season = seasonStore.activeSeason
  return date >= season.startDate && date <= season.endDate
}

// Detect which preset matches the current date range
const detectActivePreset = () => {
  const presets = datePresets.value
  const match = presets.find(p => p.from === localFilters.dateFrom && p.to === localFilters.dateTo)
  activePresetKey.value = match ? match.key : ''
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  Object.assign(localFilters, newValue)
  detectActivePreset()
}, { deep: true })

// Detect on init
detectActivePreset()

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
  activePresetKey.value = ''
  onFilterChange()
}

const setDateTo = () => {
  localFilters.dateTo = tempDateTo.value
  activePresetKey.value = ''
  onFilterChange()
}

const applyDatePreset = (preset) => {
  localFilters.dateFrom = preset.from
  localFilters.dateTo = preset.to
  activePresetKey.value = preset.key
  onFilterChange()
}

const clearFilters = () => {
  const season = seasonStore.activeSeason
  localFilters.searchName = ''
  localFilters.dateFrom = season.startDate
  localFilters.dateTo = season.endDate
  tempDateFrom.value = ''
  tempDateTo.value = ''
  activePresetKey.value = 'season'
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

@media (max-width: 768px) {
  .filter-actions {
    justify-content: center;
  }
}
</style>
