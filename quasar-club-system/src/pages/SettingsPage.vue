<template>
  <div class="settings-page q-pa-lg">
    <h2 v-if="!isMobile" class="text-center q-ma-none q-pa-none">{{ $t('settings.title') }}</h2>

    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <!-- Profile Settings Card -->
        <q-card flat bordered class="q-mb-lg bg-grey-1">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              <q-icon name="person" class="q-mr-sm" />
              {{ $t('settings.profile.title') }}
            </div>
          </q-card-section>
          
          <q-card-section class="q-pa-md">
            <!-- Display Name -->
            <div class="q-mb-md">
              <q-input
                v-model="profileForm.displayName"
                :label="$t('settings.profile.displayName')"
                outlined
                dense
                :readonly="!editingProfile"
              >
                <template v-slot:prepend>
                  <q-icon name="badge" />
                </template>
              </q-input>
            </div>

            <!-- Email (readonly) -->
            <div class="q-mb-md">
              <q-input
                v-model="user.email"
                :label="$t('settings.profile.email')"
                outlined
                dense
                readonly
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
                <template v-slot:append>
                  <q-icon name="lock" color="grey-6" />
                </template>
              </q-input>
            </div>

            <!-- Profile Actions -->
            <div class="row q-gutter-sm justify-end">
              <q-btn
                v-if="!editingProfile"
                :label="$t('settings.profile.edit')"
                color="primary"
                icon="edit"
                @click="startEditingProfile"
              />
              <template v-else>
                <q-btn
                  :label="$t('common.cancel')"
                  color="grey-7"
                  flat
                  @click="cancelEditingProfile"
                />
                <q-btn
                  :label="$t('common.save')"
                  color="positive"
                  icon="save"
                  :loading="savingProfile"
                  @click="saveProfile"
                />
              </template>
            </div>
          </q-card-section>
        </q-card>

        <!-- Password Settings Card -->
        <q-card flat bordered class="q-mb-lg bg-grey-1">
          <q-card-section class="bg-orange text-white">
            <div class="text-h6">
              <q-icon name="lock" class="q-mr-sm" />
              {{ $t('settings.password.title') }}
            </div>
          </q-card-section>
          
          <q-card-section class="q-pa-md">
            <!-- Current Password -->
            <div class="q-mb-md">
              <q-input
                v-model="passwordForm.currentPassword"
                :type="passwordVisible.current ? 'text' : 'password'"
                :label="$t('settings.password.current')"
                outlined
                dense
                :rules="[val => !!val || $t('settings.password.currentRequired')]"
              >
                <template v-slot:prepend>
                  <q-icon name="lock_open" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="passwordVisible.current ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="passwordVisible.current = !passwordVisible.current"
                  />
                </template>
              </q-input>
            </div>

            <!-- New Password -->
            <div class="q-mb-md">
              <q-input
                v-model="passwordForm.newPassword"
                :type="passwordVisible.new ? 'text' : 'password'"
                :label="$t('settings.password.new')"
                outlined
                dense
                :rules="[
                  val => !!val || $t('settings.password.newRequired'),
                  val => val.length >= 6 || $t('settings.password.minLength')
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="passwordVisible.new ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="passwordVisible.new = !passwordVisible.new"
                  />
                </template>
              </q-input>
            </div>

            <!-- Confirm New Password -->
            <div class="q-mb-md">
              <q-input
                v-model="passwordForm.confirmPassword"
                :type="passwordVisible.confirm ? 'text' : 'password'"
                :label="$t('settings.password.confirm')"
                outlined
                dense
                :rules="[
                  val => !!val || $t('settings.password.confirmRequired'),
                  val => val === passwordForm.newPassword || $t('settings.password.noMatch')
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="passwordVisible.confirm ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="passwordVisible.confirm = !passwordVisible.confirm"
                  />
                </template>
              </q-input>
            </div>

            <!-- Password Actions -->
            <div class="row justify-end">
              <q-btn
                :label="$t('settings.password.change')"
                color="orange"
                icon="security"
                :loading="changingPassword"
                :disable="!isPasswordFormValid"
                @click="changePassword"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Language Preferences Card -->
        <q-card flat bordered class="q-mb-lg bg-grey-1">
          <q-card-section class="bg-blue text-white">
            <div class="text-h6">
              <q-icon name="language" class="q-mr-sm" />
              {{ $t('settings.language.title') }}
            </div>
          </q-card-section>
          
          <q-card-section class="q-pa-md">
            <div class="text-body2 text-grey-7 q-mb-md">
              {{ $t('settings.language.description') }}
            </div>
            
            <q-select
              v-model="selectedLanguage"
              :options="languageOptions"
              :label="$t('settings.language.select')"
              outlined
              dense
              emit-value
              map-options
              @update:model-value="changeLanguage"
            >
              <template v-slot:prepend>
                <q-icon name="translate" />
              </template>
            </q-select>
          </q-card-section>
        </q-card>

        <!-- My Requests Card -->
        <q-card flat bordered class="q-mb-lg bg-grey-1">
          <q-card-section class="bg-purple text-white">
            <div class="text-h6">
              <q-icon name="how_to_reg" class="q-mr-sm" />
              {{ $t('myRequests.title') }}
            </div>
          </q-card-section>

          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item
                v-for="request in myJoinRequests"
                :key="request.id"
                class="q-py-sm"
              >
                <!-- Team info -->
                <q-item-section>
                  <q-item-label>{{ request.teamName }}</q-item-label>
                  <q-item-label caption>{{ formatDate(request.createdAt) }}</q-item-label>
                </q-item-section>

                <!-- Status badge and cancel button -->
                <q-item-section side class="row no-wrap items-center q-gutter-xs">
                  <q-badge
                    :color="statusColor(request.status)"
                    class="q-mr-xs"
                  >
                    {{ $t('myRequests.status.' + request.status) }}
                  </q-badge>
                  <q-btn
                    v-if="request.status === 'pending'"
                    flat
                    dense
                    size="sm"
                    color="grey-7"
                    :label="$t('myRequests.cancel')"
                    :loading="cancellingId === request.id"
                    @click="handleCancelRequest(request)"
                  />
                </q-item-section>
              </q-item>

              <!-- Empty state -->
              <q-item v-if="myJoinRequests.length === 0">
                <q-item-section>
                  <q-item-label caption class="text-center q-py-md text-grey-6">
                    {{ $t('myRequests.noRequests') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Account Actions Card -->
        <q-card flat bordered class="bg-grey-1">
          <q-card-section class="bg-negative text-white">
            <div class="text-h6">
              <q-icon name="warning" class="q-mr-sm" />
              {{ $t('settings.account.title') }}
            </div>
          </q-card-section>
          
          <q-card-section class="q-pa-md">
            <div class="text-body2 text-grey-7 q-mb-md">
              {{ $t('settings.account.description') }}
            </div>
            
            <div class="row justify-end">
              <q-btn
                :label="$t('settings.account.signOut')"
                color="negative"
                icon="logout"
                outline
                @click="confirmSignOut"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Sign Out Confirmation Dialog -->
    <q-dialog v-model="showSignOutDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="logout" color="negative" size="2em" class="q-mr-md" />
          <span class="text-h6">{{ $t('settings.account.confirmSignOut') }}</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ $t('settings.account.signOutMessage') }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.cancel')"
            color="grey-7"
            v-close-popup
          />
          <q-btn
            :label="$t('settings.account.signOut')"
            color="negative"
            @click="signOut"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore.ts'
import { useAuthComposable } from '@/composable/useAuthComposable.ts'
import { useScreenComposable } from '@/composable/useScreenComposable'
import { useAuthFirebase } from '@/services/authFirebase'
import { useJoinRequestUseCases } from '@/composable/useJoinRequestUseCases'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { AuthError } from '@/errors'
import { createLogger } from 'src/utils/logger'
import type { IJoinRequest } from '@/interfaces/interfaces'
import type { Unsubscribe } from 'firebase/firestore'

const log = createLogger('SettingsPage')
import { notifyError, notifySuccess } from '@/services/notificationService'

const authStore = useAuthStore()
const { refreshUser, logoutUser } = useAuthComposable()
const { isMobile } = useScreenComposable()
const $q = useQuasar()
const { t, locale } = useI18n()
const authFirebase = useAuthFirebase()
const { setUserJoinRequestsListener, cancelJoinRequest } = useJoinRequestUseCases()

// State
const editingProfile = ref(false)
const savingProfile = ref(false)
const changingPassword = ref(false)
const showSignOutDialog = ref(false)

// My Requests state
const myJoinRequests = ref<IJoinRequest[]>([])
const cancellingId = ref<string | null>(null)
let unsubscribeJoinRequests: Unsubscribe | null = null

onMounted(() => {
  unsubscribeJoinRequests = setUserJoinRequestsListener((requests) => {
    myJoinRequests.value = requests.slice().sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
  })
})

onUnmounted(() => {
  if (unsubscribeJoinRequests) {
    unsubscribeJoinRequests()
  }
})

const statusColor = (status: IJoinRequest['status']): string => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'positive'
    case 'declined': return 'negative'
    case 'cancelled': return 'grey'
    default: return 'grey'
  }
}

const formatDate = (date: Date): string => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString()
}

const handleCancelRequest = async (request: IJoinRequest) => {
  if (!request.id) return
  cancellingId.value = request.id
  try {
    await cancelJoinRequest(request.id)
    $q.notify({
      type: 'positive',
      message: t('myRequests.cancelled'),
      timeout: 3000
    })
  } catch (err) {
    log.error('Failed to cancel join request', {
      error: err instanceof Error ? err.message : String(err),
      requestId: request.id
    })
  } finally {
    cancellingId.value = null
  }
}

// Password visibility toggles
const passwordVisible = reactive({
  current: false,
  new: false,
  confirm: false
})

// User data
const user = computed(() => authStore.user)

// Forms
const profileForm = reactive({
  displayName: user.value?.displayName || ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Language settings
const selectedLanguage = ref(locale.value)
const languageOptions = [
  { label: 'Čeština', value: 'cs-CZ' },
  { label: 'English', value: 'en-US' }
]

// Computed
const isPasswordFormValid = computed(() => {
  return passwordForm.currentPassword &&
         passwordForm.newPassword &&
         passwordForm.confirmPassword &&
         passwordForm.newPassword === passwordForm.confirmPassword &&
         passwordForm.newPassword.length >= 6
})

// Methods
const startEditingProfile = () => {
  profileForm.displayName = user.value?.displayName || ''
  editingProfile.value = true
}

const cancelEditingProfile = () => {
  profileForm.displayName = user.value?.displayName || ''
  editingProfile.value = false
}

const saveProfile = async () => {
  try {
    savingProfile.value = true

    if (!user.value?.uid) return
    await authFirebase.updateUserProfile(user.value.uid, profileForm.displayName)

    // Update the auth store
    await refreshUser()

    $q.notify({
      type: 'positive',
      message: t('settings.profile.updateSuccess'),
      icon: 'check_circle'
    })

    editingProfile.value = false
  } catch (error) {
    log.error('Failed to update profile', {
      error: error instanceof Error ? error.message : String(error),
      userId: user.value?.uid
    })
    $q.notify({
      type: 'negative',
      message: t('settings.profile.updateError'),
      icon: 'error'
    })
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  try {
    changingPassword.value = true

    await authFirebase.changeUserPassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )

    notifySuccess('settings.password.changeSuccess')

    // Clear form
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''

  } catch (error) {
    log.error('Failed to change password', {
      error: error instanceof Error ? error.message : String(error),
      userId: user.value?.uid
    })

    if (error instanceof AuthError) {
      // Map specific auth error codes
      const shouldRetry = error.code === 'auth/network-request-failed'

      notifyError(error.message, {
        retry: shouldRetry,
        onRetry: shouldRetry ? () => changePassword() : undefined
      })
    } else {
      notifyError('errors.unexpected')
    }
  } finally {
    changingPassword.value = false
  }
}

const confirmSignOut = () => {
  showSignOutDialog.value = true
}

const changeLanguage = (newLanguage) => {
  locale.value = newLanguage
  selectedLanguage.value = newLanguage
  
  // Save to localStorage for persistence
  localStorage.setItem('language', newLanguage)
  
  $q.notify({
    type: 'positive',
    message: t('settings.language.changed'),
    icon: 'language'
  })
}

const signOut = async () => {
  try {
    await logoutUser()
    showSignOutDialog.value = false
    
    $q.notify({
      type: 'positive',
      message: t('settings.account.signOutSuccess'),
      icon: 'logout'
    })
  } catch (error) {
    log.error('Failed to sign out', {
      error: error instanceof Error ? error.message : String(error),
      userId: user.value?.uid
    })
    $q.notify({
      type: 'negative',
      message: t('settings.account.signOutError'),
      icon: 'error'
    })
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
  }
}
</style>