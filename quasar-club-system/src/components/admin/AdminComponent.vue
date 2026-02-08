<template>
  <div>
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
              @update:user-search-query="userSearchQuery = $event"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </template>
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

const $q = useQuasar()
const { t } = useI18n()

const {
  isLoading,
  loadError,
  teamSearchQuery,
  userSearchQuery,
  teamSurveysCount,
  userTeamsCount,
  filteredTeams,
  filteredUsers,
  overviewStats,
  loadAdminData,
  deleteTeam,
  getCreatorName,
} = useAdminComposable()

const activeTab = ref('teams')

const handleDeleteTeam = async (teamId) => {
  try {
    await deleteTeam(teamId)
    $q.notify({ type: 'positive', message: t('admin.deleteSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('admin.deleteError') })
  }
}

onMounted(() => {
  loadAdminData()
})
</script>
