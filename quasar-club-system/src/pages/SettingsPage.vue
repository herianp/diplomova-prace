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
                :type="showCurrentPassword ? 'text' : 'password'"
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
                    :name="showCurrentPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showCurrentPassword = !showCurrentPassword"
                  />
                </template>
              </q-input>
            </div>

            <!-- New Password -->
            <div class="q-mb-md">
              <q-input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
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
                    :name="showNewPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showNewPassword = !showNewPassword"
                  />
                </template>
              </q-input>
            </div>

            <!-- Confirm New Password -->
            <div class="q-mb-md">
              <q-input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
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
                    :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showConfirmPassword = !showConfirmPassword"
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
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { useScreenComposable } from '@/composable/useScreenComposable.js'
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config.ts'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { RouteEnum } from '@/enums/routesEnum.ts'

const router = useRouter()
const authStore = useAuthStore()
const { isMobile } = useScreenComposable()
const $q = useQuasar()
const { t } = useI18n()
const auth = getAuth()

// State
const editingProfile = ref(false)
const savingProfile = ref(false)
const changingPassword = ref(false)
const showSignOutDialog = ref(false)

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

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
    
    // Update Firebase Auth profile
    await updateProfile(auth.currentUser, {
      displayName: profileForm.displayName
    })
    
    // Update Firestore user document
    const userRef = doc(db, 'users', user.value.uid)
    await updateDoc(userRef, {
      displayName: profileForm.displayName
    })
    
    // Update the auth store
    await authStore.refreshUser()
    
    $q.notify({
      type: 'positive',
      message: t('settings.profile.updateSuccess'),
      icon: 'check_circle'
    })
    
    editingProfile.value = false
  } catch (error) {
    console.error('Error updating profile:', error)
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
    
    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(
      user.value.email,
      passwordForm.currentPassword
    )
    
    await reauthenticateWithCredential(auth.currentUser, credential)
    
    // Update password
    await updatePassword(auth.currentUser, passwordForm.newPassword)
    
    $q.notify({
      type: 'positive',
      message: t('settings.password.changeSuccess'),
      icon: 'check_circle'
    })
    
    // Clear form
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
  } catch (error) {
    console.error('Error changing password:', error)
    
    let errorMessage = t('settings.password.changeError')
    if (error.code === 'auth/wrong-password') {
      errorMessage = t('settings.password.wrongPassword')
    } else if (error.code === 'auth/weak-password') {
      errorMessage = t('settings.password.weakPassword')
    }
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      icon: 'error'
    })
  } finally {
    changingPassword.value = false
  }
}

const confirmSignOut = () => {
  showSignOutDialog.value = true
}

const signOut = async () => {
  try {
    await authStore.signOut()
    showSignOutDialog.value = false
    router.push(RouteEnum.LOGIN.path)
    
    $q.notify({
      type: 'positive',
      message: t('settings.account.signOutSuccess'),
      icon: 'logout'
    })
  } catch (error) {
    console.error('Error signing out:', error)
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