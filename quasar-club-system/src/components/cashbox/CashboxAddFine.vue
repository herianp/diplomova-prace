<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">{{ $t('cashbox.fines.addManualFine') }}</div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="form.playerId"
          :options="playerOptions"
          :label="$t('cashbox.fines.player')"
          emit-value
          map-options
          outlined
          dense
          :rules="[val => !!val || $t('cashbox.fines.playerRequired')]"
        />

        <q-input
          v-model.number="form.amount"
          type="number"
          :label="$t('cashbox.fines.amount')"
          :suffix="$t('cashbox.currency')"
          outlined
          dense
          class="q-mt-md"
          :rules="[val => val > 0 || $t('cashbox.fines.amountRequired')]"
        />

        <q-input
          v-model="form.reason"
          :label="$t('cashbox.fines.reason')"
          :placeholder="$t('cashbox.fines.reasonPlaceholder')"
          outlined
          dense
          class="q-mt-md"
          :rules="[val => !!val || $t('cashbox.fines.reasonRequired')]"
        />
      </q-card-section>

      <q-card-actions align="right">
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
  reason: '',
})

const playerOptions = computed(() =>
  props.teamMembers.map((m) => ({
    label: props.getPlayerName(m.uid),
    value: m.uid,
  }))
)

const isValid = computed(() =>
  form.value.playerId && form.value.amount > 0 && form.value.reason.trim()
)

const submit = () => {
  if (!isValid.value) return
  emit('submit', {
    playerId: form.value.playerId,
    amount: form.value.amount,
    reason: form.value.reason.trim(),
  })
  resetForm()
}

const resetForm = () => {
  form.value = { playerId: null, amount: null, reason: '' }
}

watch(() => props.modelValue, (val) => {
  if (val && props.preselectedPlayer) {
    form.value.playerId = props.preselectedPlayer
  }
  if (!val) resetForm()
})
</script>
