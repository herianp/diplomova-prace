import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { IJoinRequest, ISurvey, ITeam } from '@/interfaces/interfaces'

export const useTeamStore = defineStore("team", () => {
  // State
  const teams = ref<ITeam[]>([]);
  const surveys = ref<ISurvey[]>([]);
  const editedSurvey = ref<ISurvey | null>(null);
  const currentTeam = ref<ITeam | null>(null);
  const pendingJoinRequests = ref<IJoinRequest[]>([]);

  // Pure state mutations (no business logic)
  const setTeams = (teamsList: ITeam[]) => {
    teams.value = teamsList;
  };

  const setSurveys = (surveysList: ISurvey[]) => {
    surveys.value = surveysList;
  };

  const setCurrentTeam = (team: ITeam | null) => {
    currentTeam.value = team;
  };

  const setEditedSurvey = (survey: ISurvey | null) => {
    editedSurvey.value = survey;
  };

  const setPendingJoinRequests = (requests: IJoinRequest[]) => {
    pendingJoinRequests.value = requests;
  };

  const pendingJoinRequestCount = computed(() => pendingJoinRequests.value.length);

  const clearData = () => {
    teams.value = [];
    surveys.value = [];
    currentTeam.value = null;
    editedSurvey.value = null;
    pendingJoinRequests.value = [];
  };

  return {
    // State
    teams,
    surveys,
    editedSurvey,
    currentTeam,
    pendingJoinRequests,
    pendingJoinRequestCount,
    // Pure state mutations
    setTeams,
    setSurveys,
    setCurrentTeam,
    setEditedSurvey,
    setPendingJoinRequests,
    clearData
  };
});
