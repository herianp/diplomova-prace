<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ $t('cashbox.rules.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Add new rule form -->
        <q-card flat bordered class="q-mb-md q-pa-md">
          <div class="text-subtitle2 q-mb-sm">{{ $t('cashbox.rules.addRule') }}</div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-4">
              <q-input
                v-model="newRule.name"
                :label="$t('cashbox.rules.name')"
                :placeholder="$t('cashbox.rules.namePlaceholder')"
                outlined
                dense
              />
            </div>
            <div class="col-6 col-sm-2">
              <q-input
                v-model.number="newRule.amount"
                type="number"
                :label="$t('cashbox.rules.amount')"
                :suffix="$t('cashbox.currency')"
                outlined
                dense
              />
            </div>
            <div class="col-6 col-sm-3">
              <q-select
                v-model="newRule.triggerType"
                :options="triggerOptions"
                :label="$t('cashbox.rules.trigger')"
                emit-value
                map-options
                outlined
                dense
              />
            </div>
            <div class="col-6 col-sm-2">
              <q-select
                v-model="newRule.surveyType"
                :options="surveyTypeOptions"
                :label="$t('cashbox.rules.surveyType')"
                emit-value
                map-options
                outlined
                dense
              />
            </div>
            <div class="col-6 col-sm-1 flex items-center">
              <q-btn
                color="primary"
                icon="add"
                dense
                unelevated
                :disable="!isNewRuleValid"
                @click="addRule"
              />
            </div>
          </div>
        </q-card>

        <!-- Existing rules list -->
        <q-list separator v-if="fineRules.length > 0">
          <q-item v-for="rule in fineRules" :key="rule.id">
            <q-item-section avatar>
              <q-toggle
                :model-value="rule.active"
                color="positive"
                @update:model-value="toggleRule(rule)"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label :class="{ 'text-grey-5': !rule.active }">
                {{ rule.name }}
              </q-item-label>
              <q-item-label caption>
                {{ getTriggerLabel(rule.triggerType) }}
                <template v-if="rule.surveyType">
                   &middot; {{ getSurveyTypeLabel(rule.surveyType) }}
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <strong :class="rule.active ? 'text-negative' : 'text-grey-5'">
                  {{ rule.amount }} {{ $t('cashbox.currency') }}
                </strong>
                <q-btn
                  flat dense round
                  icon="delete"
                  color="grey"
                  size="sm"
                  @click="deleteRule(rule.id)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="text-center text-grey-6 q-py-lg">
          {{ $t('cashbox.history.noActivity') }}
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FineRuleTrigger } from '@/interfaces/interfaces'
import { SurveyTypes } from '@/enums/SurveyTypes'

const { t } = useI18n()

defineProps({
  modelValue: { type: Boolean, required: true },
  fineRules: { type: Array, required: true },
  teamId: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue', 'add', 'update', 'delete'])

const newRule = ref({
  name: '',
  amount: null,
  triggerType: FineRuleTrigger.NO_ATTENDANCE,
  surveyType: null,
})

const triggerOptions = computed(() => [
  { label: t('cashbox.rules.noAttendance'), value: FineRuleTrigger.NO_ATTENDANCE },
  { label: t('cashbox.rules.votedYesButAbsent'), value: FineRuleTrigger.VOTED_YES_BUT_ABSENT },
  { label: t('cashbox.rules.unvoted'), value: FineRuleTrigger.UNVOTED },
])

const surveyTypeOptions = computed(() => [
  { label: t('cashbox.rules.allTypes'), value: null },
  { label: t('survey.type.training'), value: SurveyTypes.Training },
  { label: t('survey.type.match'), value: SurveyTypes.Match },
])

const isNewRuleValid = computed(() =>
  newRule.value.name.trim() && newRule.value.amount > 0 && newRule.value.triggerType
)

const addRule = () => {
  if (!isNewRuleValid.value) return
  emit('add', {
    name: newRule.value.name.trim(),
    amount: newRule.value.amount,
    triggerType: newRule.value.triggerType,
    surveyType: newRule.value.surveyType,
    active: true,
  })
  newRule.value = { name: '', amount: null, triggerType: FineRuleTrigger.NO_ATTENDANCE, surveyType: null }
}

const toggleRule = (rule) => {
  emit('update', { ruleId: rule.id, data: { active: !rule.active } })
}

const deleteRule = (ruleId) => {
  emit('delete', ruleId)
}

const getTriggerLabel = (trigger) => {
  const option = triggerOptions.value.find((o) => o.value === trigger)
  return option?.label || trigger
}

const getSurveyTypeLabel = (type) => {
  if (type === SurveyTypes.Training) return t('survey.type.training')
  if (type === SurveyTypes.Match) return t('survey.type.match')
  return type
}
</script>
