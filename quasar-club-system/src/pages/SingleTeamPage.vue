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
        <div v-if="isCurrentUserPowerUser" class="col-12 col-lg-4">
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
import { RouteEnum } from '@/enums/routesEnum'
import HeaderBanner from '@/components/HeaderBanner.vue'
import TeamPlayerCardsComponent from '@/components/team/TeamPlayerCardsComponent.vue'
import TeamInvitationComponent from '@/components/team/TeamInvitationComponent.vue'
import TeamInvitationPendingComponent from '@/components/team/TeamInvitationPendingComponent.vue'

const route = useRoute()
const router = useRouter()
const { currentUser, isAdmin } = useAuthComposable()
const $q = useQuasar()
const { t } = useI18n()
const { createTeamInvitationNotification } = useNotifications()
const teamFirebase = useTeamFirebase()
const { deleteTeam } = useTeamUseCases()

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

// Form
const inviteForm = reactive({
  email: '',
  message: ''
})

// Computed
const teamId = computed(() => route.params.teamId)
const { isCurrentUserPowerUser }  = useAuthComposable()
const canDeleteTeam = computed(() => team.value?.creator === currentUser.value?.uid || isAdmin.value)

const loadTeam = async () => {
  try {
    const teamData = await teamFirebase.getTeamById(teamId.value)
    if (teamData) {
      team.value = { id: teamId.value, ...teamData }
      await loadTeamMembers()
      if (isCurrentUserPowerUser.value) {
        await loadPendingInvitations()
      }
    }
  } catch (error) {
    console.error('Error loading team:', error)
    $q.notify({
      type: 'negative',
      message: t('team.single.loadError'),
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadTeamMembers = async () => {
  try {
    const members = team.value.members || []
    if (!members.length) {
      teamMembers.value = []
      return
    }

    teamMembers.value = await queryByIdsInChunks('users', members)
  } catch (error) {
    console.error('Error loading team members:', error)
  }
}

const loadPendingInvitations = async () => {
  try {
    pendingInvitations.value = await teamFirebase.loadPendingInvitations(teamId.value)
  } catch (error) {
    console.error('Error loading pending invitations:', error)
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
    console.error('Error sending invitation:', error)
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
    console.error('Error cancelling invitation:', error)
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
    await teamFirebase.removeMember(teamId.value, memberToRemove.value.uid)

    $q.notify({
      type: 'positive',
      message: t('team.single.members.removed'),
      icon: 'check'
    })

    showRemoveDialog.value = false
    memberToRemove.value = null
    await loadTeam()

  } catch (error) {
    console.error('Error removing member:', error)
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
    console.error('Error promoting member:', error)
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
    console.error('Error deleting team:', error)
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
