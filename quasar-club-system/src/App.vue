<template>
  <router-view />
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { listenerRegistry } from '@/services/listenerRegistry'

// Safety net: cleanup all listeners when app unmounts (tab close, navigation away)
onBeforeUnmount(() => {
  listenerRegistry.unregisterAll()
})
</script>
