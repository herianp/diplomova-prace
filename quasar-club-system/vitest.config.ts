import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'src': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json', 'json-summary'],
      include: [
        'src/composable/useFormValidation.ts',
        'src/composable/useDateHelpers.ts',
        'src/composable/useSurveyFilters.ts',
        'src/composable/useAuthUseCases.ts',
        'src/composable/useSurveyUseCases.ts',
        'src/composable/useCashboxUseCases.ts',
        'src/services/listenerRegistry.ts',
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/boot/**',
        'src/i18n/**',
        'src/router/**',
        'src/pages/**',
        'src/layouts/**',
        'src/components/**',
        'src/firebase/config.ts',
        'src/migrations/**'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  }
})
