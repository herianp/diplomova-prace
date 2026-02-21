<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>{{ t('app.title') }}</q-toolbar-title>
        <q-btn
          flat
          dense
          round
          icon="logout"
          :title="t('settings.account.signOut')"
          @click="handleSignOut"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthUseCases } from '@/composable/useAuthUseCases'

const { t } = useI18n()
const { signOut } = useAuthUseCases()

const handleSignOut = async () => {
  await signOut()
}
</script>
