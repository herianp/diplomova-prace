import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

export default defineBoot(({ app }) => {
  const i18n = createI18n({
    locale: 'cs-CZ', // Default language
    fallbackLocale: 'en-US', // Fallback language
    globalInjection: true, // Allows using $t() globally
    messages, // Load messages from src/i18n
  })

  // Set i18n instance on app
  app.use(i18n)
})
