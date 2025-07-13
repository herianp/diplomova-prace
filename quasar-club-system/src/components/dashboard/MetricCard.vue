<template>
  <q-card flat bordered class="metric-card">
    <q-card-section class="q-pa-md">
      <div class="row items-center">
        <div class="col">
          <div class="metric-value">{{ value }}</div>
          <div class="metric-title">{{ title }}</div>
        </div>
        <div class="col-auto">
          <q-icon 
            :name="icon" 
            :color="color"
            size="2rem"
            class="metric-icon"
          />
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
  transition: all 0.3s ease;
  cursor: pointer;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.metric-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1976d2;
  line-height: 1;
}

.metric-title {
  font-size: 0.875rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
}

.metric-icon {
  opacity: 0.8;
}
</style>