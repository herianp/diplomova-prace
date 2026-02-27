<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ $t('cashbox.fines.addManualFine') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-sm" style="max-height: calc(100vh - 120px); overflow-y: auto">
        <!-- Tabs: Predefined / Custom -->
        <q-tabs v-model="activeTab" dense align="left" class="q-mb-md" active-color="primary" indicator-color="primary">
          <q-tab name="predefined" :label="$t('cashbox.templates.predefined')" no-caps />
          <q-tab name="custom" :label="$t('cashbox.templates.custom')" no-caps />
        </q-tabs>

        <q-tab-panels v-model="activeTab" animated>
          <!-- Predefined Tab -->
          <q-tab-panel name="predefined" class="q-px-none">
            <div v-for="category in templateCategories" :key="category" class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">{{ category }}</div>
              <div class="row q-gutter-sm">
                <q-chip
                  v-for="tmpl in templatesByCategory(category)"
                  :key="tmpl.id"
                  :selected="selectedTemplate?.id === tmpl.id"
                  clickable
                  color="primary"
                  :text-color="selectedTemplate?.id === tmpl.id ? 'white' : 'dark'"
                  :outline="selectedTemplate?.id !== tmpl.id"
                  @click="selectTemplate(tmpl)"
                >
                  {{ tmpl.name }} — {{ tmpl.amount }} {{ $t('cashbox.currency') }}
                </q-chip>
              </div>
            </div>

            <div v-if="!fineTemplates?.length" class="text-center text-grey-6 q-py-md">
              {{ $t('cashbox.templates.noTemplates') }}
            </div>

            <q-separator class="q-my-md" />
            <q-expansion-item
              :label="$t('cashbox.templates.manage')"
              icon="settings"
              dense
              header-class="text-caption"
            >
              <div class="row q-col-gutter-sm q-mb-sm">
                <div class="col-5">
                  <q-input v-model="newTemplate.name" :label="$t('cashbox.templates.name')" outlined dense />
                </div>
                <div class="col-3">
                  <q-input v-model.number="newTemplate.amount" type="number" :label="$t('cashbox.templates.amount')" :suffix="$t('cashbox.currency')" outlined dense />
                </div>
                <div class="col-3">
                  <q-input v-model="newTemplate.category" :label="$t('cashbox.templates.category')" outlined dense />
                </div>
                <div class="col-1 flex items-center">
                  <q-btn icon="add" dense unelevated color="primary" :disable="!isNewTemplateValid" @click="addTemplate" />
                </div>
              </div>
              <q-chip
                v-for="tmpl in fineTemplates"
                :key="tmpl.id"
                removable
                @remove="$emit('deleteTemplate', tmpl.id)"
                class="q-mr-xs q-mb-xs"
              >
                {{ tmpl.name }} ({{ tmpl.amount }} {{ $t('cashbox.currency') }}) — {{ tmpl.category }}
              </q-chip>
            </q-expansion-item>
          </q-tab-panel>

          <!-- Custom Tab -->
          <q-tab-panel name="custom" class="q-px-none">
            <q-input
              v-model.number="form.amount"
              type="number"
              :label="$t('cashbox.fines.amount')"
              :suffix="$t('cashbox.currency')"
              outlined
              dense
              class="q-mb-md"
            />
            <q-input
              v-model="form.reason"
              :label="$t('cashbox.fines.reason')"
              :placeholder="$t('cashbox.fines.reasonPlaceholder')"
              outlined
              dense
            />
          </q-tab-panel>
        </q-tab-panels>

        <!-- Player Selection -->
        <q-separator class="q-my-md" />
        <div class="text-subtitle2 q-mb-sm">
          {{ $t('cashbox.fines.selectPlayers') }}
          <q-badge v-if="selectedPlayers.length" color="primary" class="q-ml-sm">
            {{ selectedPlayers.length }}
          </q-badge>
        </div>
        <div class="row q-gutter-xs q-mb-sm">
          <q-btn flat dense size="sm" no-caps :label="$t('common.selectAll')" @click="selectAllPlayers" />
          <q-btn flat dense size="sm" no-caps :label="$t('common.deselectAll')" @click="deselectAllPlayers" />
        </div>
        <q-input v-model="playerSearch" :placeholder="$t('cashbox.fines.selectPlayer')" outlined dense clearable class="q-mb-sm">
          <template v-slot:prepend><q-icon name="search" /></template>
        </q-input>
        <div style="max-height: 250px; overflow-y: auto">
          <q-list dense>
            <q-item v-for="member in filteredMembers" :key="member.uid" tag="label" clickable>
              <q-item-section side>
                <q-checkbox v-model="selectedPlayers" :val="member.uid" />
              </q-item-section>
              <q-item-section>{{ getPlayerName(member.uid) }}</q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat :label="$t('common.cancel')" v-close-popup no-caps />
        <q-btn
          color="negative"
          :label="$t('cashbox.fines.addFine')"
          no-caps
          unelevated
          :disable="!isValid"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  teamMembers: { type: Array, required: true },
  preselectedPlayer: { type: String, default: null },
  getPlayerName: { type: Function, required: true },
  fineTemplates: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'submit', 'addTemplate', 'deleteTemplate'])

const activeTab = ref('predefined')
const selectedTemplate = ref(null)
const selectedPlayers = ref([])
const playerSearch = ref('')
const form = ref({ amount: null, reason: '' })
const newTemplate = ref({ name: '', amount: null, category: '' })

// Template grouping
const templateCategories = computed(() => {
  const categories = [...new Set(props.fineTemplates.map((t) => t.category))]
  return categories.sort()
})

const templatesByCategory = (category) => {
  return props.fineTemplates.filter((t) => t.category === category)
}

const selectTemplate = (tmpl) => {
  if (selectedTemplate.value?.id === tmpl.id) {
    selectedTemplate.value = null
    form.value = { amount: null, reason: '' }
  } else {
    selectedTemplate.value = tmpl
    form.value = { amount: tmpl.amount, reason: tmpl.name }
  }
}

// Template management
const isNewTemplateValid = computed(() =>
  newTemplate.value.name.trim() && newTemplate.value.amount > 0 && newTemplate.value.category.trim()
)

const addTemplate = () => {
  if (!isNewTemplateValid.value) return
  emit('addTemplate', {
    name: newTemplate.value.name.trim(),
    amount: newTemplate.value.amount,
    category: newTemplate.value.category.trim(),
  })
  newTemplate.value = { name: '', amount: null, category: '' }
}

// Player filtering
const filteredMembers = computed(() => {
  if (!playerSearch.value) return props.teamMembers
  const search = playerSearch.value.toLowerCase()
  return props.teamMembers.filter((m) =>
    props.getPlayerName(m.uid).toLowerCase().includes(search)
  )
})

const selectAllPlayers = () => {
  selectedPlayers.value = props.teamMembers.map((m) => m.uid)
}

const deselectAllPlayers = () => {
  selectedPlayers.value = []
}

// Validation
const isValid = computed(() =>
  selectedPlayers.value.length > 0 && form.value.amount > 0 && form.value.reason?.trim()
)

const submit = () => {
  if (!isValid.value) return
  emit('submit', {
    playerIds: selectedPlayers.value,
    amount: form.value.amount,
    reason: form.value.reason.trim(),
  })
  resetForm()
}

const resetForm = () => {
  form.value = { amount: null, reason: '' }
  selectedPlayers.value = []
  selectedTemplate.value = null
  playerSearch.value = ''
  activeTab.value = 'predefined'
}

watch(() => props.modelValue, (val) => {
  if (val && props.preselectedPlayer) {
    selectedPlayers.value = [props.preselectedPlayer]
  }
  if (!val) resetForm()
})
</script>
