<template>
  <q-btn flat round dense>
    <q-avatar size="30px" color="primary" text-color="white">
      <span v-if="userInitial" class="text-weight-bold">{{ userInitial }}</span>
      <q-icon v-else name="person" />
    </q-avatar>

    <q-menu anchor="bottom right" self="top right">
      <!-- User Info Header -->
      <div class="q-pa-md bg-grey-1" style="min-width: 220px;">
        <div class="text-subtitle1 text-weight-bold">{{ displayName }}</div>
        <div class="text-caption text-grey-7">{{ userEmail }}</div>
      </div>

      <q-separator />

      <q-list>
        <q-item clickable v-ripple v-close-popup @click="$router.push(RouteEnum.SETTINGS.path)">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>{{ $t('settings.title') }}</q-item-section>
        </q-item>

        <q-item clickable v-ripple v-close-popup class="text-red" @click="logoutUser">
          <q-item-section avatar>
            <q-icon name="logout" color="red" />
          </q-item-section>
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { RouteEnum } from '@/enums/routesEnum'

const authStore = useAuthStore()
const { logoutUser } = useAuthComposable()

const displayName = computed(() => authStore.user?.displayName || '')
const userEmail = computed(() => authStore.user?.email || '')
const userInitial = computed(() => {
  const name = displayName.value
  return name ? name.charAt(0).toUpperCase() : ''
})
</script>
