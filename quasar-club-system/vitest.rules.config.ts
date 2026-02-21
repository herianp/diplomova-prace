import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.rules.test.ts'],
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    // Run test files sequentially - all files share same Firestore emulator instance;
    // parallel execution causes clearFirestore() in one file to race with beforeEach in another
    fileParallelism: false
  }
})
