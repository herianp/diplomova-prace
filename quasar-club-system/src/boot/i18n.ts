import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'
import type { MessageSchema } from 'src/i18n'

export type AvailableLocale = 'cs-CZ' | 'en-US'

export default defineBoot(({ app }) => {
  const savedLocale = localStorage.getItem('language') as AvailableLocale | null

  const i18n = createI18n<[MessageSchema], AvailableLocale>({
    locale: savedLocale || 'cs-CZ',
    fallbackLocale: 'en-US',
    globalInjection: true,
    legacy: true, // Keep legacy mode for template $t() support
    messages,
  })

  app.use(i18n)
})
