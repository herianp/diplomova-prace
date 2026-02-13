<template>
  <q-card flat bordered class="metric-card" :style="{ borderLeftColor: `var(--q-${color})` }">
    <q-card-section class="q-pa-md">
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="metric-value">{{ value }}</div>
          <div class="metric-title">{{ title }}</div>
        </div>
        <div class="col-auto">
          <div class="metric-icon-wrapper" :class="`bg-${color}`">
            <q-icon :name="icon" color="white" size="1.25rem" />
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'primary'
  }
})
</script>

<style scoped>
.metric-card {
  border-left: 3px solid;
  height: 100%;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1d1d1d;
  line-height: 1.2;
}

.metric-title {
  font-size: 0.75rem;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
}

.metric-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
}
</style>
