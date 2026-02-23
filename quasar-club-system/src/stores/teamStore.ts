import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { IJoinRequest, ISurvey, ITeam, ITeamSettings } from '@/interfaces/interfaces'

export const useTeamStore = defineStore("team", () => {
  // State
  const teams = ref<ITeam[]>([]);
  const surveys = ref<ISurvey[]>([]);
  const editedSurvey = ref<ISurvey | null>(null);
  const currentTeam = ref<ITeam | null>(null);
  const pendingJoinRequests = ref<IJoinRequest[]>([]);
  const currentTeamSettings = ref<ITeamSettings | null>(null);

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

  const setCurrentTeamSettings = (settings: ITeamSettings | null) => {
    currentTeamSettings.value = settings;
  };

  const pendingJoinRequestCount = computed(() => pendingJoinRequests.value.length);

  const clearData = () => {
    teams.value = [];
    surveys.value = [];
    currentTeam.value = null;
    editedSurvey.value = null;
    pendingJoinRequests.value = [];
    currentTeamSettings.value = null;
  };

  return {
    // State
    teams,
    surveys,
    editedSurvey,
    currentTeam,
    pendingJoinRequests,
    pendingJoinRequestCount,
    currentTeamSettings,
    // Pure state mutations
    setTeams,
    setSurveys,
    setCurrentTeam,
    setEditedSurvey,
    setPendingJoinRequests,
    setCurrentTeamSettings,
    clearData
  };
});
