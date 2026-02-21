import { defineStore } from "pinia";
import { ref } from "vue";
import { ISurvey, ITeam } from '@/interfaces/interfaces'

export const useTeamStore = defineStore("team", () => {
  // State
  const teams = ref<ITeam[]>([]);
  const surveys = ref<ISurvey[]>([]);
  const editedSurvey = ref<ISurvey | null>(null);
  const currentTeam = ref<ITeam | null>(null);

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

  const clearData = () => {
    teams.value = [];
    surveys.value = [];
    currentTeam.value = null;
    editedSurvey.value = null;
  };

  return {
    // State
    teams,
    surveys,
    editedSurvey,
    currentTeam,
    // Pure state mutations
    setTeams,
    setSurveys,
    setCurrentTeam,
    setEditedSurvey,
    clearData
  };
});
