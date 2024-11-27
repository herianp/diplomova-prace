<template>
  <div>
    <button @click="setLanguage('en')">English</button>
    <button @click="setLanguage('cs')">Česky</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const setLanguage = (lang) => {
  locale.value = lang;
};
</script>

<style scoped>

</style>
