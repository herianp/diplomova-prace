<template>
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
          <div v-if="props.teamMembers.length === 0" class="text-center text-grey-6 q-py-xl">
            <q-icon name="group_off" size="4em" class="q-mb-md" />
            <div class="text-h6">{{ $t('team.single.members.empty') }}</div>
          </div>

          <div v-else class="row q-col-gutter-md">
            <div
              v-for="member in props.teamMembers"
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
                    v-if="isUserPowerUser(member.uid)"
                    color="orange"
                    text-color="white"
                    dense
                    :label="$t('team.single.powerUser')"
                    icon="admin_panel_settings"
                  />

                  <!-- Member Actions (for power users) -->
                  <div v-if="isCurrentUserPowerUser && member.uid !== currentUser.uid" class="q-mt-sm">
                    <q-btn
                      flat
                      dense
                      color="orange"
                      icon="upgrade"
                      :label="$t('team.single.members.makePowerUser')"
                      @click="handlePromoteToPowerUser(member)"
                      size="sm"
                    />
                    <q-btn
                      flat
                      dense
                      color="negative"
                      icon="person_remove"
                      :label="$t('team.single.members.remove')"
                      @click="handleConfirmRemoveMember(member)"
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
</template>

<script setup>
import { useAuthComposable } from '@/composable/useAuthComposable.js'

const props = defineProps({
  teamMembers: {
    type: Array,
    required: true,
    default: () => []
  },
  team: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits([
  'confirmRemoveMember',
  'promoteToPowerUser',
])

const { isCurrentUserPowerUser, currentUser }  = useAuthComposable();

const isUserPowerUser = (uid) => {
  return props.team?.powerusers?.includes(uid)
}


const handleConfirmRemoveMember = (member) => {
  emit('confirmRemoveMember', member)
}

const handlePromoteToPowerUser = (member) => {
  emit('promoteToPowerUser', member)
}

</script>

<style scoped>
.member-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

</style>
