<template>
  <q-btn-toggle
    v-model="currentLocale"
    toggle-color="primary"
    flat
    dense
    no-caps
    :options="[
      { label: 'CZ', value: 'cs-CZ' },
      { label: 'EN', value: 'en-US' }
    ]"
    @update:model-value="setLanguage"
  />
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('language', lang)
}
</script>
