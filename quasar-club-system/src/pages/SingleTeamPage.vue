<template>
  <div class="single-team-page q-pa-lg">
    <div v-if="loading" class="row justify-center q-mt-xl">
      <q-spinner-dots size="50px" color="primary" />
    </div>

    <div v-else-if="team" class="team-content">
      <HeaderBanner
        :title="team.name"
        :description="$t('team.manageTeamDescription', { teamName: team.name, memberCount: team.members.length })"
      />

      <div class="row q-col-gutter-lg">
        <TeamPlayerCardsComponent
          :team-members="teamMembers"
          :pending-invitations="pendingInvitations"
          :invite-form="inviteForm"
          :sending-invite="sendingInvite"
          :team="team"
          @confirm-remove-member="confirmRemoveMember"
          @promote-to-power-user="promoteToPowerUser"
        />

        <!-- Team Management Section (Power Users Only) -->
        <div v-if="isPageUserPowerUser" class="col-12 col-lg-4">
          <TeamInvitationComponent
            :invite-form="inviteForm"
            :sending-invite="sendingInvite"
            @send-invitation="sendInvitation"
            @update-email="updateInviteEmail"
            @update-message="updateInviteMessage"
          />

          <!-- Pending Invitations -->
          <TeamInvitationPendingComponent
            :pending-invitations="pendingInvitations"
            @cancel-invitation="cancelInvitation"
          />
        </div>
      </div>

      <!-- Team Settings (Power Users Only) -->
      <div v-if="isPageUserPowerUser && teamSettings" class="q-mt-lg">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="settings" class="q-mr-sm" />
              {{ $t('team.single.settings.title') }}
            </div>

            <!-- Chat Toggle -->
            <q-toggle
              v-model="teamSettings.chatEnabled"
              :label="$t('team.single.settings.chatEnabled')"
              color="primary"
            />
            <div class="text-caption text-grey-6 q-ml-xl q-mb-md">
              {{ $t('team.single.settings.chatEnabledHint') }}
            </div>

            <!-- Address Section -->
            <div class="text-subtitle2 q-mb-sm">{{ $t('team.single.settings.address') }}</div>
            <div class="row q-gutter-sm q-mb-md">
              <div class="col">
                <q-input
                  v-model="addressSearch"
                  :placeholder="$t('team.single.settings.addressPlaceholder')"
                  outlined
                  dense
                  @keydown.enter.prevent="searchAddress"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  :label="$t('team.single.settings.searchAddress')"
                  icon="search"
                  color="primary"
                  outline
                  dense
                  :loading="searchingAddress"
                  @click="searchAddress"
                />
              </div>
            </div>

            <!-- Current address display -->
            <div v-if="teamSettings.address?.name" class="text-body2 q-mb-sm">
              <q-icon name="place" color="primary" /> {{ teamSettings.address.name }}
            </div>
            <div class="row q-gutter-sm q-mb-md">
              <q-input
                v-model.number="teamSettings.address.latitude"
                :label="$t('team.single.settings.latitude')"
                type="number"
                outlined
                dense
                class="col"
                step="0.01"
              />
              <q-input
                v-model.number="teamSettings.address.longitude"
                :label="$t('team.single.settings.longitude')"
                type="number"
                outlined
                dense
                class="col"
                step="0.01"
              />
            </div>

            <!-- Save Button -->
            <q-btn
              :label="$t('common.save')"
              icon="save"
              color="primary"
              unelevated
              :loading="savingSettings"
              @click="saveSettings"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Danger Zone (Creator Only) -->
      <div v-if="canDeleteTeam" class="q-mt-xl">
        <q-card flat bordered class="border-negative">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="warning" color="negative" size="1.5rem" />
              <div class="text-subtitle1 text-weight-bold text-negative">{{ $t('team.single.delete.dangerZone') }}</div>
            </div>
            <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('team.single.delete.dangerDescription') }}</div>
          </q-card-section>
          <q-card-actions>
            <q-btn
              outline
              color="negative"
              icon="delete_forever"
              :label="$t('team.single.delete.button')"
              @click="showDeleteDialog = true"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <div v-else class="text-center q-mt-xl">
      <q-icon name="error" size="4em" color="negative" class="q-mb-md" />
      <div class="text-h6">{{ $t('team.single.notFound') }}</div>
    </div>

    <!-- Remove Member Confirmation Dialog -->
    <q-dialog v-model="showRemoveDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="negative" size="2em" class="q-mr-md" />
          <span class="text-h6">{{ $t('team.single.members.confirmRemove') }}</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="memberToRemove">
            {{ $t('team.single.members.removeMessage', { name: memberToRemove.displayName || memberToRemove.email }) }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="grey-7" v-close-popup />
          <q-btn :label="$t('team.single.members.remove')" color="negative" @click="removeMember" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Team Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card style="min-width: 380px;">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="delete_forever" color="negative" size="2em" class="q-mr-md" />
          <span class="text-h6 text-negative">{{ $t('team.single.delete.confirmTitle') }}</span>
        </q-card-section>

        <q-card-section>
          <div class="text-body2 q-mb-md">{{ $t('team.single.delete.confirmMessage') }}</div>
          <q-input
            v-model="deleteConfirmName"
            :label="$t('team.single.delete.typeTeamName')"
            :hint="team?.name"
            filled
            dense
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            :label="$t('team.single.delete.button')"
            color="negative"
            :disable="deleteConfirmName !== team?.name"
            :loading="isDeleting"
            @click="handleDeleteTeam"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { queryByIdsInChunks } from '@/utils/firestoreUtils'
import { useNotifications } from '@/composable/useNotificationsComposable'
import { useTeamFirebase } from '@/services/teamFirebase'
import { useTeamUseCases } from '@/composable/useTeamUseCases'
import { useTeamStore } from '@/stores/teamStore'
import { RouteEnum } from '@/enums/routesEnum'
import HeaderBanner from '@/components/HeaderBanner.vue'
import TeamPlayerCardsComponent from '@/components/team/TeamPlayerCardsComponent.vue'
import TeamInvitationComponent from '@/components/team/TeamInvitationComponent.vue'
import { createLogger } from 'src/utils/logger'

const log = createLogger('SingleTeamPage')
import TeamInvitationPendingComponent from '@/components/team/TeamInvitationPendingComponent.vue'

const route = useRoute()
const router = useRouter()
const { currentUser, isAdmin } = useAuthComposable()
const $q = useQuasar()
const { t } = useI18n()
const { createTeamInvitationNotification } = useNotifications()
const teamFirebase = useTeamFirebase()
const { deleteTeam } = useTeamUseCases()
const teamStore = useTeamStore()

// State
const loading = ref(true)
const team = ref(null)
const teamMembers = ref([])
const pendingInvitations = ref([])
const sendingInvite = ref(false)
const showRemoveDialog = ref(false)
const memberToRemove = ref(null)
const showDeleteDialog = ref(false)
const deleteConfirmName = ref('')
const isDeleting = ref(false)
const teamSettings = ref(null)
const savingSettings = ref(false)
const addressSearch = ref('')
const searchingAddress = ref(false)

// Form
const inviteForm = reactive({
  email: '',
  message: ''
})

// Computed
const teamId = computed(() => route.params.teamId)
const canDeleteTeam = computed(() => team.value?.creator === currentUser.value?.uid || isAdmin.value)
const isPageUserPowerUser = computed(() => {
  const uid = currentUser.value?.uid
  return uid ? (team.value?.powerusers?.includes(uid) || false) : false
})

const loadTeam = async () => {
  try {
    const teamData = await teamFirebase.getTeamById(teamId.value)
    if (teamData) {
      team.value = { id: teamId.value, ...teamData }
      await loadTeamMembers()
      await loadSettingsData()
      // Check power user status against the loaded team (not teamStore.currentTeam)
      const uid = currentUser.value?.uid
      const isPowerUserForThisTeam = uid ? (teamData.powerusers?.includes(uid) || false) : false
      if (isPowerUserForThisTeam) {
        await loadPendingInvitations()
      }
    }
  } catch (error) {
    log.error('Failed to load team', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value
    })
    $q.notify({
      type: 'negative',
      message: t('team.single.loadError'),
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadSettingsData = async () => {
  try {
    const settings = await teamFirebase.getTeamSettings(teamId.value)
    teamSettings.value = settings
    teamStore.setCurrentTeamSettings(settings)
  } catch (error) {
    log.error('Failed to load team settings', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value
    })
    $q.notify({
      type: 'negative',
      message: t('team.single.settings.loadError'),
      icon: 'error'
    })
  }
}

const saveSettings = async () => {
  if (!teamSettings.value) return
  savingSettings.value = true
  try {
    await teamFirebase.updateTeamSettings(teamId.value, teamSettings.value)
    teamStore.setCurrentTeamSettings(teamSettings.value)
    $q.notify({
      type: 'positive',
      message: t('team.single.settings.saveSuccess'),
      icon: 'check'
    })
  } catch (error) {
    log.error('Failed to save team settings', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value
    })
    $q.notify({
      type: 'negative',
      message: t('team.single.settings.saveError'),
      icon: 'error'
    })
  } finally {
    savingSettings.value = false
  }
}

const searchAddress = async () => {
  if (!addressSearch.value.trim()) return
  searchingAddress.value = true
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressSearch.value)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'QuasarClubSystem/1.0' } }
    )
    const results = await response.json()
    if (results.length > 0) {
      teamSettings.value.address = {
        name: results[0].display_name,
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
      }
    } else {
      $q.notify({
        type: 'negative',
        message: t('team.single.settings.addressNotFound') || 'Address not found',
        icon: 'error'
      })
    }
  } catch (error) {
    log.error('Failed to search address', {
      error: error instanceof Error ? error.message : String(error)
    })
  } finally {
    searchingAddress.value = false
  }
}

const loadTeamMembers = async () => {
  const members = team.value.members || []

  try {
    if (!members.length) {
      teamMembers.value = []
      return
    }

    teamMembers.value = await queryByIdsInChunks('users', members)
  } catch (error) {
    log.error('Failed to load team members', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value,
      memberCount: members.length
    })
  }
}

const loadPendingInvitations = async () => {
  try {
    pendingInvitations.value = await teamFirebase.loadPendingInvitations(teamId.value)
  } catch (error) {
    log.error('Failed to load pending invitations', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value
    })
  }
}

const sendInvitation = async () => {
  try {
    sendingInvite.value = true

    // Check if user exists
    const targetUser = await teamFirebase.findUserByEmail(inviteForm.email)

    if (!targetUser) {
      $q.notify({
        type: 'negative',
        message: t('team.single.invite.userNotFound'),
        icon: 'error'
      })
      return
    }

    // Check if user is already a member
    if (team.value.members?.includes(targetUser.id)) {
      $q.notify({
        type: 'negative',
        message: t('team.single.invite.alreadyMember'),
        icon: 'error'
      })
      return
    }

    // Check if invitation already exists
    const alreadyInvited = await teamFirebase.checkExistingInvitation(teamId.value, inviteForm.email)

    if (alreadyInvited) {
      $q.notify({
        type: 'negative',
        message: t('team.single.invite.alreadyInvited'),
        icon: 'error'
      })
      return
    }

    // Create invitation
    const invitationData = {
      teamId: teamId.value,
      teamName: team.value.name,
      inviterId: currentUser.value.uid,
      inviterName: currentUser.value.displayName || currentUser.value.email,
      inviteeId: targetUser.id,
      inviteeEmail: inviteForm.email,
      message: inviteForm.message,
      status: 'pending',
      createdAt: new Date()
    }

    const invitationRef = await teamFirebase.sendTeamInvitation(invitationData)

    // Create notification for the invitee
    await createTeamInvitationNotification({
      ...invitationData,
      id: invitationRef.id
    })

    $q.notify({
      type: 'positive',
      message: t('team.single.invite.sent'),
      icon: 'send'
    })

    // Reset form and reload
    inviteForm.email = ''
    inviteForm.message = ''
    await loadPendingInvitations()

  } catch (error) {
    log.error('Failed to send invitation', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value,
      email: inviteForm.email
    })
    $q.notify({
      type: 'negative',
      message: t('team.single.invite.error'),
      icon: 'error'
    })
  } finally {
    sendingInvite.value = false
  }
}

const cancelInvitation = async (invitation) => {
  try {
    await teamFirebase.cancelInvitation(invitation.id)
    $q.notify({
      type: 'positive',
      message: t('team.single.pendingInvites.cancelled'),
      icon: 'check'
    })
    await loadPendingInvitations()
  } catch (error) {
    log.error('Failed to cancel invitation', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value,
      invitationId: invitation.id
    })
    $q.notify({
      type: 'negative',
      message: t('team.single.pendingInvites.cancelError'),
      icon: 'error'
    })
  }
}

const confirmRemoveMember = (member) => {
  memberToRemove.value = member
  showRemoveDialog.value = true
}

const removeMember = async () => {
  try {
    const auditContext = currentUser.value ? {
      actorUid: currentUser.value.uid,
      actorDisplayName: currentUser.value.displayName || currentUser.value.email || 'Unknown',
      memberDisplayName: memberToRemove.value.displayName
    } : undefined

    await teamFirebase.removeMember(teamId.value, memberToRemove.value.uid, auditContext)

    $q.notify({
      type: 'positive',
      message: t('team.single.members.removed'),
      icon: 'check'
    })

    showRemoveDialog.value = false
    memberToRemove.value = null
    await loadTeam()

  } catch (error) {
    log.error('Failed to remove member', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value,
      memberId: memberToRemove.value.uid
    })
    $q.notify({
      type: 'negative',
      message: t('team.single.members.removeError'),
      icon: 'error'
    })
  }
}

const promoteToPowerUser = async (member) => {
  try {
    await teamFirebase.promoteToPowerUser(teamId.value, member.uid)

    $q.notify({
      type: 'positive',
      message: t('team.single.members.promoted'),
      icon: 'check'
    })

    await loadTeam()

  } catch (error) {
    log.error('Failed to promote member', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value,
      memberId: member.uid
    })
    $q.notify({
      type: 'negative',
      message: t('team.single.members.promoteError'),
      icon: 'error'
    })
  }
}

const updateInviteEmail = (value) => {
  inviteForm.email = value
}

const updateInviteMessage = (value) => {
  inviteForm.message = value
}

const handleDeleteTeam = async () => {
  if (deleteConfirmName.value !== team.value?.name) return
  isDeleting.value = true
  try {
    await deleteTeam(teamId.value)
    $q.notify({
      type: 'positive',
      message: t('team.single.delete.success'),
      icon: 'check'
    })
    showDeleteDialog.value = false
    router.push(RouteEnum.TEAM.path)
  } catch (error) {
    log.error('Failed to delete team', {
      error: error instanceof Error ? error.message : String(error),
      teamId: teamId.value
    })
    $q.notify({
      type: 'negative',
      message: t('team.single.delete.error'),
      icon: 'error'
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  loadTeam()
})
</script>

<style scoped>
.single-team-page {
  max-width: 1400px;
  margin: 0 auto;
}

.invitation-item:last-child .q-separator {
  display: none;
}

@media (max-width: 768px) {
  .single-team-page {
    padding: 1rem;
  }
}
</style>
