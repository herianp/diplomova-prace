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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore'
import { db } from '@/firebase/config.ts'
import { useNotifications } from '@/composable/useNotificationsComposable.js'
import HeaderBanner from '@/components/HeaderBanner.vue'
import TeamPlayerCardsComponent from '@/components/team/TeamPlayerCardsComponent.vue'
import TeamInvitationComponent from '@/components/team/TeamInvitationComponent.vue'
import TeamInvitationPendingComponent from '@/components/team/TeamInvitationPendingComponent.vue'

const route = useRoute()
const { currentUser } = useAuthComposable()
const $q = useQuasar()
const { t } = useI18n()
const { createTeamInvitationNotification } = useNotifications()

// State
const loading = ref(true)
const team = ref(null)
const teamMembers = ref([])
const pendingInvitations = ref([])
const sendingInvite = ref(false)
const showRemoveDialog = ref(false)
const memberToRemove = ref(null)

// Form
const inviteForm = reactive({
  email: '',
  message: ''
})

// Computed
const teamId = computed(() => route.params.teamId)
const { isCurrentUserPowerUser }  = useAuthComposable();

const loadTeam = async () => {
  try {
    const teamDoc = await getDoc(doc(db, 'teams', teamId.value))
    if (teamDoc.exists()) {
      team.value = { id: teamDoc.id, ...teamDoc.data() }
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

    const allUsers = []

    // Split members into chunks of 30 (Firestore IN query limit)
    const chunkSize = 30
    for (let i = 0; i < members.length; i += chunkSize) {
      const chunk = members.slice(i, i + chunkSize)

      const usersQuery = query(
        collection(db, 'users'),
        where('__name__', 'in', chunk)
      )
      const usersSnapshot = await getDocs(usersQuery)

      const chunkUsers = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }))

      allUsers.push(...chunkUsers)
    }

    teamMembers.value = allUsers
  } catch (error) {
    console.error('Error loading team members:', error)
  }
}

const loadPendingInvitations = async () => {
  try {
    const invitationsQuery = query(
      collection(db, 'teamInvitations'),
      where('teamId', '==', teamId.value),
      where('status', '==', 'pending')
    )
    const invitationsSnapshot = await getDocs(invitationsQuery)
    pendingInvitations.value = invitationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading pending invitations:', error)
  }
}

const sendInvitation = async () => {
  try {
    sendingInvite.value = true

    // Check if user exists
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', inviteForm.email)
    )
    const usersSnapshot = await getDocs(usersQuery)

    if (usersSnapshot.empty) {
      $q.notify({
        type: 'negative',
        message: t('team.single.invite.userNotFound'),
        icon: 'error'
      })
      return
    }

    const targetUser = usersSnapshot.docs[0]

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
    const existingInviteQuery = query(
      collection(db, 'teamInvitations'),
      where('teamId', '==', teamId.value),
      where('inviteeEmail', '==', inviteForm.email),
      where('status', '==', 'pending')
    )
    const existingInviteSnapshot = await getDocs(existingInviteQuery)

    if (!existingInviteSnapshot.empty) {
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

    const invitationRef = await addDoc(collection(db, 'teamInvitations'), invitationData)

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
    await deleteDoc(doc(db, 'teamInvitations', invitation.id))
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
    const teamRef = doc(db, 'teams', teamId.value)
    await updateDoc(teamRef, {
      members: arrayRemove(memberToRemove.value.uid),
      powerusers: arrayRemove(memberToRemove.value.uid)
    })

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
    const teamRef = doc(db, 'teams', teamId.value)
    await updateDoc(teamRef, {
      powerusers: arrayUnion(member.uid)
    })

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
