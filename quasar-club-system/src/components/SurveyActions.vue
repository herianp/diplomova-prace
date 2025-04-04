<template>
  <div class="row items-center justify-center q-gutter-sm q-mt-sm">

    <!-- ⚙️ Settings button -->
    <q-btn
      v-if="isPowerUser"
      round
      dense
      flat
      icon="tune"
      color="primary"
      size="sm"
      @click="$emit('open-settings')"
      class="action-btn"
    >
      <q-tooltip>Settings</q-tooltip>
    </q-btn>

    <!-- 👍 Yes -->
    <q-btn
      unelevated
      rounded
      size="sm"
      icon="thumb_up"
      :color="yesActive ? 'positive' : 'grey-4'"
      text-color="black"
      @click="$emit('vote', true)"
      class="action-btn vote-btn"
    >
      <q-tooltip>Vote Yes</q-tooltip>
    </q-btn>

    <!-- 👎 No -->
    <q-btn
      unelevated
      rounded
      size="sm"
      icon="thumb_down"
      :color="noActive ? 'negative' : 'grey-4'"
      text-color="black"
      @click="$emit('vote', false)"
      class="action-btn vote-btn"
    >
      <q-tooltip>Vote No</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup>
defineProps({
  yesActive: Boolean,
  noActive: Boolean,
  isPowerUser: Boolean
})

defineEmits(['vote', 'open-settings'])
</script>

<style scoped>
.vote-btn:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: scale(1.03);
  transition: all 0.2s ease-in-out;
}

.action-btn {
  transition: all 0.2s ease-in-out;
}
</style>
