<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>{{ t('app.title') }}</q-toolbar-title>
        <q-btn
          flat
          icon="logout"
          :label="$q.screen.gt.xs ? t('settings.account.signOut') : undefined"
          :title="t('settings.account.signOut')"
          @click="handleSignOut"
          class="q-px-sm"
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthUseCases } from '@/composable/useAuthUseCases'
import { RouteEnum } from '@/enums/routesEnum'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const { signOut } = useAuthUseCases()

const handleSignOut = async () => {
  try {
    await signOut()
  } catch {
    // signOut failed — force navigate to login anyway
  }
  await router.push(RouteEnum.LOGIN.path)
}
</script>
