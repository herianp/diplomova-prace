<template>
  <div class="flex justify-center q-gutter-xs">
    <q-btn
      flat
      round
      dense
      :class="{ 'selected-lang': currentLocale === 'cs-CZ' }"
      @click="setLanguage('cs-CZ')"
    >
      <span class="fi fi-cz flag-btn"></span>
    </q-btn>
    <q-btn
      flat
      round
      dense
      :class="{ 'selected-lang': currentLocale === 'en-US' }"
      @click="setLanguage('en-US')"
    >
      <span class="fi fi-gb flag-btn"></span>
    </q-btn>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import 'flag-icons/css/flag-icons.min.css'

const { locale } = useI18n()

const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
  localStorage.setItem('language', lang)
}
</script>

<style scoped>
.flag-btn {
  width: 24px;
  height: 18px;
  border-radius: 2px;
  background-size: cover;
}

.selected-lang {
  opacity: 1;
  transform: scale(1.15);
}

.q-btn:not(.selected-lang) {
  opacity: 0.5;
}
</style>
