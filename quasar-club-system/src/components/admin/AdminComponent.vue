<template>
  <div class="admin-container">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h5 text-weight-bold">{{ $t('admin.title') }}</div>
        <div class="text-caption text-grey">{{ $t('admin.description') }}</div>
      </div>
      <div class="col-auto">
        <q-chip color="red" text-color="white" icon="admin_panel_settings">
          Admin
        </q-chip>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center q-pa-xl">
      <q-spinner size="3em" color="primary" />
    </div>

    <!-- Error -->
    <q-banner v-else-if="loadError" class="bg-negative text-white q-mb-md" rounded>
      {{ $t('admin.loadError') }}: {{ loadError }}
    </q-banner>

    <!-- Content -->
    <template v-else>
      <!-- Metric Cards -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <MetricCard
            :title="$t('admin.totalTeams')"
            :value="overviewStats.totalTeams"
            icon="groups"
            color="primary"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <MetricCard
            :title="$t('admin.totalUsers')"
            :value="overviewStats.totalUsers"
            icon="person"
            color="positive"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <MetricCard
            :title="$t('admin.totalSurveys')"
            :value="overviewStats.totalSurveys"
            icon="poll"
            color="info"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <MetricCard
            :title="$t('admin.avgTeamSize')"
            :value="overviewStats.avgTeamSize"
            icon="analytics"
            color="warning"
          />
        </div>
      </div>

      <!-- Tabs -->
      <q-card flat bordered>
        <q-tabs v-model="activeTab" class="text-primary" align="left" dense>
          <q-tab name="teams" :label="$t('admin.teamsTab')" icon="groups" />
          <q-tab name="users" :label="$t('admin.usersTab')" icon="person" />
          <q-tab name="audit" :label="$t('admin.auditTab')" icon="history" />
          <q-tab name="rateLimits" :label="$t('admin.rateLimitsTab')" icon="speed" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <q-tab-panel name="teams">
            <AdminTeamsTab
              :filtered-teams="filteredTeams"
              :team-search-query="teamSearchQuery"
              :team-surveys-count="teamSurveysCount"
              :get-creator-name="getCreatorName"
              @update:team-search-query="teamSearchQuery = $event"
              @delete-team="handleDeleteTeam"
            />
          </q-tab-panel>

          <q-tab-panel name="users">
            <AdminUsersTab
              :filtered-users="filteredUsers"
              :user-search-query="userSearchQuery"
              :user-teams-count="userTeamsCount"
              :show-deleted-users="showDeletedUsers"
              :all-teams="allTeams"
              @update:user-search-query="userSearchQuery = $event"
              @update:show-deleted-users="showDeletedUsers = $event"
              @delete-user-clicked="handleUserDeleteClick"
            />
          </q-tab-panel>

          <q-tab-panel name="audit">
            <AdminAuditTab :filtered-teams="filteredTeams" />
          </q-tab-panel>

          <q-tab-panel name="rateLimits">
            <AdminRateLimitsTab />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </template>

    <!-- Simple delete user confirmation dialog (non-creator) -->
    <q-dialog v-model="showSimpleDeleteDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $t('admin.deleteUser') }}</div>
        </q-card-section>
        <q-card-section>
          <p>{{ $t('admin.confirmDeleteUser', { name: userToDelete?.displayName || userToDelete?.name || '-', email: userToDelete?.email || '' }) }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn
            flat
            :label="$t('common.delete')"
            color="negative"
            :loading="isDeletingUser"
            @click="executeSimpleDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Creator conflict dialog -->
    <CreatorConflictDialog
      v-model="showCreatorConflict"
      :user="userToDelete"
      :affected-teams="creatorAffectedTeams"
      :all-users="allUsers"
      @confirm="executeCreatorDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useAdminComposable } from '@/composable/useAdminComposable'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import AdminTeamsTab from '@/components/admin/AdminTeamsTab.vue'
import AdminUsersTab from '@/components/admin/AdminUsersTab.vue'
import AdminAuditTab from '@/components/admin/AdminAuditTab.vue'
import AdminRateLimitsTab from '@/components/admin/AdminRateLimitsTab.vue'
import CreatorConflictDialog from '@/components/admin/CreatorConflictDialog.vue'

const $q = useQuasar()
const { t } = useI18n()

const {
  allTeams,
  allUsers,
  isLoading,
  loadError,
  showDeletedUsers,
  teamSearchQuery,
  userSearchQuery,
  teamSurveysCount,
  userTeamsCount,
  filteredTeams,
  filteredUsers,
  overviewStats,
  loadAdminData,
  deleteTeam,
  deleteUser,
  getTeamsWhereUserIsCreator,
  getCreatorName,
} = useAdminComposable()

const activeTab = ref('teams')

// User deletion state
const showSimpleDeleteDialog = ref(false)
const showCreatorConflict = ref(false)
const userToDelete = ref(null)
const creatorAffectedTeams = ref([])
const isDeletingUser = ref(false)

const handleDeleteTeam = async (teamId) => {
  try {
    await deleteTeam(teamId)
    $q.notify({ type: 'positive', message: t('admin.deleteSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('admin.deleteError') })
  }
}

const handleUserDeleteClick = (user) => {
  userToDelete.value = user
  const affectedTeams = getTeamsWhereUserIsCreator(user.uid, allTeams.value)

  if (affectedTeams.length === 0) {
    // Non-creator: simple confirm
    showSimpleDeleteDialog.value = true
  } else {
    // Creator: show creator conflict dialog
    creatorAffectedTeams.value = affectedTeams
    showCreatorConflict.value = true
  }
}

const executeSimpleDelete = async () => {
  if (!userToDelete.value) return
  isDeletingUser.value = true
  try {
    await deleteUser(userToDelete.value.uid, [])
    showSimpleDeleteDialog.value = false
    $q.notify({ type: 'positive', message: t('admin.deleteUserSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('admin.deleteUserError') })
  } finally {
    isDeletingUser.value = false
  }
}

const executeCreatorDelete = async (resolutions) => {
  if (!userToDelete.value) return
  isDeletingUser.value = true
  try {
    await deleteUser(userToDelete.value.uid, resolutions)
    $q.notify({ type: 'positive', message: t('admin.deleteUserSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('admin.deleteUserError') })
  } finally {
    isDeletingUser.value = false
  }
}

onMounted(() => {
  loadAdminData()
})
</script>

<style scoped>
.admin-container {
  width: 100%;
  padding: 1rem;
}
@media (min-width: 600px) {
  .admin-container {
    padding: 1.5rem;
  }
}
</style>
