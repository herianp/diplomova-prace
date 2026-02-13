import { defineStore } from "pinia";
import { ref } from "vue";
import { ISurvey, ITeam } from '@/interfaces/interfaces'

export const useTeamStore = defineStore("team", () => {
  // State
  const teams = ref<ITeam[]>([]);
  const surveys = ref<ISurvey[]>([]);
  const editedSurvey = ref<ISurvey | null>(null);
  const currentTeam = ref<ITeam | null>(null);

  // Firestore listeners - managed by use cases
  const unsubscribeTeams = ref<(() => void) | null>(null);
  const unsubscribeSurveys = ref<(() => void) | null>(null);

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

  const setTeamsUnsubscribe = (unsubscribeFn: (() => void) | null) => {
    unsubscribeTeams.value = unsubscribeFn;
  };

  const setSurveysUnsubscribe = (unsubscribeFn: (() => void) | null) => {
    unsubscribeSurveys.value = unsubscribeFn;
  };

  const clearData = () => {
    if (unsubscribeTeams.value) {
      unsubscribeTeams.value();
      unsubscribeTeams.value = null;
    }

    if (unsubscribeSurveys.value) {
      unsubscribeSurveys.value();
      unsubscribeSurveys.value = null;
    }

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
    unsubscribeTeams,
    unsubscribeSurveys,
    // Pure state mutations
    setTeams,
    setSurveys,
    setCurrentTeam,
    setEditedSurvey,
    setTeamsUnsubscribe,
    setSurveysUnsubscribe,
    clearData
  };
});
