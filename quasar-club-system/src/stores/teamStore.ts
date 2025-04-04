import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { ISurvey } from '@/interfaces/interfaces'
import { useTeamComposable } from '../composable/useTeamComposable'

const getInitialTeam = () => ({
  creator: '1',
  id: '1',
  invitationCode: '123',
  members: [],
  name: 'Team 1',
  powerusers: [],
  surveys: [],
});

export const useTeamStore = defineStore("team", {
  state: () => ({
    teams: reactive([]),
    surveys: ref<ISurvey[]>([]),
    editedSurvey: ref(null),
    currentTeam: getInitialTeam(),

    // Firestore listeners
    unsubscribeTeams: ref<(() => void) | null>(null),
    unsubscribeSurveys: ref<(() => void) | null>(null),
  }),

  getters: {
    getPositiveVotes: (state) => (surveyId: string) => {
      return state.surveys.find(survey => survey.id === surveyId).votes.filter(vote => vote.vote).length;
    },
    getNegativeVotes: (state) => (surveyId: string) => {
      return state.surveys.find(survey => survey.id === surveyId).votes.filter(vote => !vote.vote).length;
    },
  },

  actions: {
    // ✅ listening for Teams, return promise, because we need await in beforeEach
    setTeamListener(userId: string): Promise<void> {
      const { getTeamsByUserId } = useTeamComposable();

      return new Promise((resolve) => {
        if (this.unsubscribeTeams) {
          this.unsubscribeTeams(); // 🛑 Stop previous listener
        }

        this.unsubscribeTeams = getTeamsByUserId(userId, (teams) => {
          this.teams = teams;
          console.log("Teams updated: ", this.teams);

          if (teams.length > 0) {
            this.setCurrentTeam(this.teams[0]);
            console.log("Current team set to: ", this.currentTeam);
          }

          resolve(); // ✅ Resolve the Promise when teams are set
        });
      });
    },

    // ✅ listening for surveys
    setSurveysListener(teamId: string) {
      const { getSurveysByTeamId } = useTeamComposable();

      if (this.unsubscribeSurveys) {
        this.unsubscribeSurveys(); // 🛑 Stop previous listener
      }

      getSurveysByTeamId(teamId, (surveys) => {
        this.surveys = surveys;
      });
    },

    async getTeamByIdAndSetCurrentTeam(teamId: string) {
      const { getTeamById } = useTeamComposable();

      this.currentTeam = await getTeamById(teamId);
    },

    async addVote(surveyId: string, userUid: string, newVote: boolean) {
      const { addVote } = useTeamComposable();

      const survey = this.surveys.find((s) => s.id === surveyId);
      if (survey) await addVote(surveyId, userUid, newVote, survey.votes);
    },

    async addSurveyVote(surveyId: string, userUid: string, newVote: boolean) {
      const { addSurveyVote } = useTeamComposable();

      const survey = this.surveys.find(s => s.id === surveyId);
      if (survey) {
        const isUserVoteExists = survey.votes.find(v => v.userUid === userUid);
        const votes = survey.votes || [];

        await addSurveyVote(surveyId, userUid, newVote, votes, isUserVoteExists);
      }
    },

    clearData() {
      if (this.unsubscribeTeams) {
        this.unsubscribeTeams();
        this.unsubscribeTeams = null;
      }

      if (this.unsubscribeSurveys) {
        this.unsubscribeSurveys();
        this.unsubscribeSurveys = null;
      }

      this.teams = [];
      this.surveys = [];
      this.currentTeam = null;
    },

    //Setters
    setCurrentTeam(team: any) {
      this.currentTeam = team;
    }
  },
});
