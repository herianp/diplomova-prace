// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig((ctx) => {
  return {
    boot: [
      'i18n',
      'axios'
    ],
    css: [
      'app.scss'
    ],
    extras: [
      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
    ],
    build: {
      productionSourceMap: false,
      minify: true,
      modern: true,
      target: {
        browser: [ 'es2022', 'firefox115', 'chrome115', 'safari14' ],
        node: 'node20'
      },
      vueRouterMode: 'hash',
      extendViteConf(viteConf) {
        viteConf.resolve.alias = {
          ...viteConf.resolve.alias,
          "@": fileURLToPath(new URL("./src", import.meta.url))
        };
        
        // Build optimizations for smaller size
        if (viteConf.command === 'build') {
          viteConf.build = {
            ...viteConf.build,
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
              output: {
                // Manual chunks to optimize loading
                manualChunks: {
                  // Firebase chunk
                  firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
                  // Charts chunk
                  charts: ['chart.js'],
                  // Vue core
                  vue: ['vue', 'vue-router', 'pinia'],
                  // Quasar core
                  quasar: ['quasar'],
                  // Date utilities
                  luxon: ['luxon']
                }
              }
            }
          };
        }
      },
      vitePlugins: [
        ['@intlify/unplugin-vue-i18n/vite', {
          ssr: ctx.modeName === 'ssr',
          include: [ fileURLToPath(new URL('./src/i18n', import.meta.url)) ]
        }],

        ['vite-plugin-checker', {
          eslint: {
            lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
            useFlatConfig: true
          }
        }, { server: false }]
      ]
    },
    devServer: {
      open: true
    },
    framework: {
      config: {},
      plugins: [
        'Notify'
      ]
    },
    animations: [],
    ssr: {
      prodPort: 3000,
      middlewares: [
        'render' // keep this as last one
      ],
      pwa: false
    },
    pwa: {
      workboxMode: 'GenerateSW' // 'GenerateSW' or 'InjectManifest'
    },
    cordova: {
    },
    capacitor: {
      hideSplashscreen: true
    },
    electron: {
      preloadScripts: [ 'electron-preload' ],
      inspectPort: 5858,
      bundler: 'packager', // 'packager' or 'builder'
      packager: {
      },
      builder: {
        appId: 'quasar-club-system'
      }
    },
    bex: {
      extraScripts: []
    }
  }
})
