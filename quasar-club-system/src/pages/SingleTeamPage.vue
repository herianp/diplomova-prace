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
        <!-- Team Members Section (Available to all users) -->
        <div class="col-12 col-lg-8">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section class="bg-primary text-white">
              <div class="text-h6">
                <q-icon name="group" class="q-mr-sm" />
                {{ $t('team.single.members.title') }}
              </div>
            </q-card-section>

            <q-card-section class="q-pa-md">
              <div v-if="teamMembers.length === 0" class="text-center text-grey-6 q-py-xl">
                <q-icon name="group_off" size="4em" class="q-mb-md" />
                <div class="text-h6">{{ $t('team.single.members.empty') }}</div>
              </div>

              <div v-else class="row q-col-gutter-md">
                <div
                  v-for="member in teamMembers"
                  :key="member.uid"
                  class="col-12 col-sm-6 col-md-4"
                >
                  <q-card flat bordered class="member-card">
                    <q-card-section class="text-center q-pa-md">
                      <q-avatar size="60px" color="primary" text-color="white" class="q-mb-md">
                        <q-icon v-if="!member.photoURL" name="person" size="30px" />
                        <img v-else :src="member.photoURL" alt="Profile" />
                      </q-avatar>

                      <div class="text-h6 q-mb-xs">{{ member.displayName || member.email }}</div>
                      <div class="text-caption text-grey-6 q-mb-sm">{{ member.email }}</div>

                      <!-- Power User Badge -->
                      <q-chip
                        v-if="isPowerUser(member.uid)"
                        color="orange"
                        text-color="white"
                        dense
                        :label="$t('team.single.powerUser')"
                        icon="admin_panel_settings"
                      />

                      <!-- Member Actions (for power users) -->
                      <div v-if="isCurrentUserPowerUser && member.uid !== currentUser.uid" class="q-mt-sm">
                        <q-btn
                          v-if="!isPowerUser(member.uid)"
                          flat
                          dense
                          color="orange"
                          icon="upgrade"
                          :label="$t('team.single.members.makePowerUser')"
                          @click="promoteToPowerUser(member)"
                          size="sm"
                        />
                        <q-btn
                          flat
                          dense
                          color="negative"
                          icon="person_remove"
                          :label="$t('team.single.members.remove')"
                          @click="confirmRemoveMember(member)"
                          size="sm"
                          class="q-ml-xs"
                        />
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Team Management Section (Power Users Only) -->
        <div v-if="isCurrentUserPowerUser" class="col-12 col-lg-4">
          <q-card flat bordered class="bg-grey-1 q-mb-lg">
            <q-card-section class="bg-orange text-white">
              <div class="text-h6">
                <q-icon name="person_add" class="q-mr-sm" />
                {{ $t('team.single.invite.title') }}
              </div>
            </q-card-section>

            <q-card-section class="q-pa-md">
              <div class="text-body2 text-grey-7 q-mb-md">
                {{ $t('team.single.invite.description') }}
              </div>

              <!-- Invite Form -->
              <q-form @submit="sendInvitation" class="q-gutter-md">
                <q-input
                  v-model="inviteForm.email"
                  type="email"
                  :label="$t('team.single.invite.email')"
                  outlined
                  dense
                  :rules="[
                    val => !!val || $t('team.single.invite.emailRequired'),
                    val => /.+@.+\..+/.test(val) || $t('team.single.invite.emailInvalid')
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="email" />
                  </template>
                </q-input>

                <q-input
                  v-model="inviteForm.message"
                  type="textarea"
                  :label="$t('team.single.invite.message')"
                  outlined
                  dense
                  rows="3"
                  :placeholder="$t('team.single.invite.messagePlaceholder')"
                >
                  <template v-slot:prepend>
                    <q-icon name="message" />
                  </template>
                </q-input>

                <div class="row justify-end">
                  <q-btn
                    type="submit"
                    color="orange"
                    icon="send"
                    :label="$t('team.single.invite.send')"
                    :loading="sendingInvite"
                  />
                </div>
              </q-form>
            </q-card-section>
          </q-card>

          <!-- Pending Invitations -->
          <q-card v-if="pendingInvitations.length > 0" flat bordered class="bg-grey-1">
            <q-card-section class="bg-amber text-white">
              <div class="text-h6">
                <q-icon name="schedule" class="q-mr-sm" />
                {{ $t('team.single.pendingInvites.title') }}
              </div>
            </q-card-section>

            <q-card-section class="q-pa-md">
              <div v-for="invitation in pendingInvitations" :key="invitation.id" class="invitation-item q-mb-md">
                <div class="row items-center no-wrap">
                  <div class="col">
                    <div class="text-body1">{{ invitation.email }}</div>
                    <div class="text-caption text-grey-6">
                      {{ $t('team.single.pendingInvites.sentOn') }}: {{ formatDate(invitation.createdAt) }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="cancel"
                      @click="cancelInvitation(invitation)"
                      size="sm"
                    >
                      <q-tooltip>{{ $t('team.single.pendingInvites.cancel') }}</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <q-separator class="q-mt-sm" />
              </div>
            </q-card-section>
          </q-card>
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
import { DateTime } from 'luxon'
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
import { useNotifications } from '@/composable/useNotifications.js'
import HeaderBanner from '@/components/HeaderBanner.vue'

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
const isCurrentUserPowerUser = computed(() => {
  return team.value?.powerusers?.includes(currentUser.value?.uid)
})

// Methods
const isPowerUser = (uid) => {
  return team.value?.powerusers?.includes(uid)
}

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

const formatDate = (date) => {
  return DateTime.fromJSDate(date.toDate()).toLocaleString(DateTime.DATETIME_SHORT)
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

.team-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.member-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.invitation-item:last-child .q-separator {
  display: none;
}

@media (max-width: 768px) {
  .single-team-page {
    padding: 1rem;
  }

  .team-header {
    padding: 1.5rem;
  }
}
</style>
