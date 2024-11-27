import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import 'bootstrap'; // Bootstrap JavaScript (includes Popper.js)

import App from './App.vue'
import router from './router'
import {createI18n} from "vue-i18n";
import en from './locales/en.json';
import cs from './locales/cs.json';

const app = createApp(App)

const i18n = createI18n({
    locale: 'en', // Default language
    fallbackLocale: 'en', // Language, if the translation is missing
    messages: {
        en,
        cs
    }
});

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
