<template>
  <div class="card" :style="{ width: cardWidth }">
    <div class="card-body">
      <div class="card-custom-header">
        <!-- Slot for title -->
        <slot name="title">
          <h5 class="card-title">{{ title }}</h5>
        </slot>
        <div class="card-statistics">
          <!-- Slot for statistics -->
          <slot name="statistics"></slot>
        </div>
      </div>

      <!-- Slot for description -->
      <slot name="description">
        <p class="card-text">{{ description }}</p>
      </slot>

      <div class="d-flex justify-content-between align-items-center">
        <!-- Slot for footer content (e.g., date, buttons) -->
        <slot name="footer"></slot>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <slot name="modal"></slot>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  cardWidth: {
    type: String,
    default: "18rem", // Default width, can be overridden
  },
});
</script>

<style scoped>
.card {
  min-width: 500px;
  margin-top: 20px;
}

@media (max-width: 1024px) {
  .card {
    width: calc(100% - 20px) !important;
    margin-top: 20px;
    min-width: 350px;
  }
}

.card-custom-header {
  display: flex;
  justify-content: space-between;
}

.card-statistics {
  display: flex;
  flex-direction: column;
  align-items: end;
  width: 100px;
}
</style>
