<template>
  <div class="container-page">
    <h1>Teams</h1>
    <button
        class="btn-danger"
        @click="openNewTeamForm()"
    >
      Create team
    </button>

    <d-card-slots
        v-for="team in teamStore.teams"
        :key="team.id"
        :title="team.name"
        :description="team.description"
    >
      <template #statistics>
        <h5>Members: {{ team.members.length }}</h5>
        <h5 style="color: gray">
          Power Users: {{ team.powerusers.length }}
        </h5>
      </template>

      <template #footer>
        <a class="btn btn-primary" @click="openTeam(team.id)">Open</a>
      </template>
    </d-card-slots>

    <!-- Modalní okno -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <TeamForm
          @closeModal="closeModal"
      />
    </div>

  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {useTeamStore} from "@/stores/team.js";
import DCardSlots from "@/components/base/d-card-slots.vue";
import TeamForm from "@/components/modal/TeamForm.vue";
import {useAuthStore} from "@/stores/auth.js";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import router from "@/router/index.js";

const teamStore = useTeamStore();
const authStore = useAuthStore();

const auth = getAuth();
const isModalOpen = ref(false);

function openNewTeamForm() {
  isModalOpen.value = true;
}

function openTeam(teamId) {
  console.log("Joining team:", teamId);
  router.push(`/${teamId}/surveys`);
}

function closeModal() {
  isModalOpen.value = false;
  console.log('close modal');
}

onMounted(() => {
  // method wait until the user is authenticated
  onAuthStateChanged(auth, (user) => {
    if (user) {
      teamStore.getTeamsByUserId(user.uid);
    } else {
      console.error("No authenticated user found.");
    }
  });
});
</script>

<style scoped>

</style>
