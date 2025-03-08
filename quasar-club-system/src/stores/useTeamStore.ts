import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import {
  createTeam,
  getTeamsByUserId,
  getTeamById,
  getSurveysByTeamId,
  deleteSurvey,
  addSurvey,
  updateSurvey,
  addVote,
  addCashboxTransaction
} from "@/services/teamService";
import { ISurvey } from '../interfaces/interfaces'

export const useTeamStore = defineStore("team", {
  state: () => ({
    teams: reactive([]),
    surveys: reactive([]),
    editedSurvey: ref(null),
    currentTeam: ref(null),

    // Firestore listeners
    unsubscribeTeams: ref<(() => void) | null>(null),
    unsubscribeSurveys: ref<(() => void) | null>(null),
  }),

  actions: {
    async createTeam(teamName: string, userId: string) {
      await createTeam(teamName, userId);
    },

    // ✅ listening for Teams
    setTeamListener(userId: string) {
      if (this.unsubscribeTeams) {
        this.unsubscribe(); // 🛑 Stop previous listener
      }

      this.unsubscribeTeams = getTeamsByUserId(userId, (teams) => {
        this.teams = teams
        if(teams.length > 0) {
          this.setCurrentTeam(this.teams[0]);
        }
      });
    },

    // ✅ listening for surveys
    setSurveysListener(teamId: string) {
      if (this.unsubscribeSurveys) {
        this.unsubscribeSurveys(); // 🛑 Stop previous listener
      }

      getSurveysByTeamId(teamId, (surveys) => {
        this.surveys = surveys;
      });
    },

    async getTeamByIdAndSetCurrentTeam(teamId: string) {
      this.currentTeam = await getTeamById(teamId);
    },

    async deleteSurvey(surveyId: string) {
      await deleteSurvey(surveyId);
    },

    async addSurvey(newSurvey: ISurvey) {
      await addSurvey(newSurvey);
    },

    async updateSurvey(surveyId: string, updatedSurvey: any) {
      await updateSurvey(surveyId, updatedSurvey);
    },

    async addVote(surveyId: string, userUid: string, newVote: boolean) {
      const survey = this.surveys.find((s) => s.id === surveyId);
      if (survey) await addVote(surveyId, userUid, newVote, survey.votes);
    },

    async addCashboxTransaction(teamId: string, transactionData: any) {
      await addCashboxTransaction(teamId, transactionData);
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
