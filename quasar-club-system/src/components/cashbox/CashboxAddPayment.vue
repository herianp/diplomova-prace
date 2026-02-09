<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">{{ $t('cashbox.payments.recordPayment') }}</div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="form.playerId"
          :options="playerOptions"
          :label="$t('cashbox.payments.player')"
          emit-value
          map-options
          outlined
          dense
          :rules="[val => !!val || $t('cashbox.payments.playerRequired')]"
        />

        <q-input
          v-model.number="form.amount"
          type="number"
          :label="$t('cashbox.payments.amount')"
          :suffix="$t('cashbox.currency')"
          outlined
          dense
          class="q-mt-md"
          :rules="[val => val > 0 || $t('cashbox.payments.amountRequired')]"
        />

        <q-input
          v-model="form.note"
          :label="$t('cashbox.payments.note')"
          :placeholder="$t('cashbox.payments.notePlaceholder')"
          outlined
          dense
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="$t('common.cancel')" v-close-popup no-caps />
        <q-btn
          color="positive"
          :label="$t('cashbox.payments.recordPayment')"
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

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  teamMembers: { type: Array, required: true },
  preselectedPlayer: { type: String, default: null },
  getPlayerName: { type: Function, required: true },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = ref({
  playerId: null,
  amount: null,
  note: '',
})

const playerOptions = computed(() =>
  props.teamMembers.map((m) => ({
    label: props.getPlayerName(m.uid),
    value: m.uid,
  }))
)

const isValid = computed(() =>
  form.value.playerId && form.value.amount > 0
)

const submit = () => {
  if (!isValid.value) return
  emit('submit', {
    playerId: form.value.playerId,
    amount: form.value.amount,
    note: form.value.note.trim() || undefined,
  })
  resetForm()
}

const resetForm = () => {
  form.value = { playerId: null, amount: null, note: '' }
}

watch(() => props.modelValue, (val) => {
  if (val && props.preselectedPlayer) {
    form.value.playerId = props.preselectedPlayer
  }
  if (!val) resetForm()
})
</script>
