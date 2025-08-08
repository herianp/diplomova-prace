import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ISurvey } from '@/interfaces/interfaces'

const getInitialTeam = () => ({
  creator: '1',
  id: '1',
  invitationCode: '123',
  members: [],
  name: 'Team 1',
  powerusers: [],
  surveys: [],
});

export const useTeamStore = defineStore("team", () => {
  // State
  const teams = ref([]);
  const surveys = ref<ISurvey[]>([]);
  const editedSurvey = ref(null);
  const currentTeam = ref(getInitialTeam());

  // Firestore listeners - managed by use cases
  const unsubscribeTeams = ref<(() => void) | null>(null);
  const unsubscribeSurveys = ref<(() => void) | null>(null);

  // Getters
  const getPositiveVotes = computed(() => (surveyId: string) => {
    return surveys.value.find(survey => survey.id === surveyId)?.votes.filter(vote => vote.vote).length || 0;
  });

  const getNegativeVotes = computed(() => (surveyId: string) => {
    return surveys.value.find(survey => survey.id === surveyId)?.votes.filter(vote => !vote.vote).length || 0;
  });

  // Pure state mutations (no business logic)
  const setTeams = (teamsList: any[]) => {
    teams.value = teamsList;
  };

  const setSurveys = (surveysList: ISurvey[]) => {
    surveys.value = surveysList;
  };

  const setCurrentTeam = (team: any) => {
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
    // Getters
    getPositiveVotes,
    getNegativeVotes,
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
