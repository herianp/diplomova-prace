<template>
  <div class="row q-col-gutter-sm q-mb-lg">
    <div class="col-6 col-md-3">
      <MetricCard
        :title="$t('cashbox.dashboard.totalFined')"
        :value="`${summary.totalFined} ${$t('cashbox.currency')}`"
        icon="gavel"
        color="negative"
      />
    </div>
    <div class="col-6 col-md-3">
      <MetricCard
        :title="$t('cashbox.dashboard.totalPaid')"
        :value="`${summary.totalPaid} ${$t('cashbox.currency')}`"
        icon="payments"
        color="positive"
      />
    </div>
    <div class="col-6 col-md-3">
      <MetricCard
        :title="$t('cashbox.dashboard.outstanding')"
        :value="`${summary.totalOutstanding} ${$t('cashbox.currency')}`"
        icon="account_balance"
        color="warning"
      />
    </div>
    <div class="col-6 col-md-3">
      <MetricCard
        :title="$t('cashbox.dashboard.credits')"
        :value="`${summary.totalCredits} ${$t('cashbox.currency')}`"
        icon="savings"
        color="teal"
      />
    </div>
    <div class="col-6 col-md-3">
      <MetricCard
        :title="$t('cashbox.dashboard.totalFines')"
        :value="summary.totalFinesCount"
        icon="receipt_long"
        color="info"
      />
    </div>
  </div>
</template>

<script setup>
import MetricCard from '@/components/dashboard/MetricCard.vue'

defineProps({
  summary: {
    type: Object,
    required: true
  }
})
</script>
