import { defineStore } from 'pinia'

export const useClubStore = defineStore({
  id: 'club',
  state: () => ({
    clubName: 'Club Name',
    activeSurveys: [
      {'title': 'Survey 1', 'id': 1, 'description': 'Umělka, úterý 18:00',
        'votes': [
          {'user': {'id': 1, 'name':'user_1'}, 'vote': false},
          {'user': {'id': 2, 'name':'user_2'}, 'vote': true},
          {'user': {'id': 3, 'name':'user_3'}, 'vote': true},
          {'user': {'id': 4, 'name':'user_4'}, 'vote': true},
        ]
      },
      {'title': 'Survey 2', 'id': 2, 'description': 'Umělka, úterý 18:00',
        'votes': [
          {'user': {'id': 1, 'name':'user_1'}, 'vote': true},
          {'user': {'id': 2, 'name':'user_2'}, 'vote': false},
          {'user': {'id': 3, 'name':'user_3'}, 'vote': true},
          {'user': {'id': 4, 'name':'user_4'}, 'vote': true},
          {'user': {'id':5, 'name':'user_5'}, 'vote': false},
        ]
      },
      {'title': 'Survey 3', 'id': 3, 'description': 'Umělka, úterý 18:00',
        'votes': [
          {'user': {'id': 1, 'name':'user_1'}, 'vote': true},
        ]
      },
      {'title': 'Survey 4', 'id': 4, 'description': 'Umělka, úterý 18:00',
        'votes': [
          {'user': {'id': 1, 'name':'user_1'}, 'vote': false},
          {'user': {'id': 2, 'name':'user_2'}, 'vote': false},
          {'user': {'id': 3, 'name':'user_3'}, 'vote': true},
        ]
      },
      {'title': 'Survey 5', 'id': 5, 'description': 'Umělka, úterý 18:00',
        'votes': [
          {'user': {'id': 1, 'name':'user_1'}, 'vote': false},
          {'user': {'id': 2, 'name':'user_2'}, 'vote': false},
        ]
      },
    ],
  }),
  getters: {
    getPositiveVotes: (state) => (surveyId) => {
      return state.activeSurveys.find(survey => survey.id === surveyId).votes.filter(vote => vote.vote).length;
    },
    getNegativeVotes: (state) => (surveyId) => {
      return state.activeSurveys.find(survey => survey.id === surveyId).votes.filter(vote => !vote.vote).length;
    },
    getSurveyById: (state) => (surveyId) => {
      return state.activeSurveys.find(survey => survey.id === surveyId);
    },
  },
  actions: {
    setClubName(newName) {
      this.clubName = newName;
    },
    addVote(surveyId, userId, vote) {
      const survey = this.activeSurveys.find(s => s.id === surveyId);
      if (survey) {
        const existingVote = survey.votes.find(v => v.user.id === userId);
        if (existingVote) {
          if (existingVote.vote === vote) {
            console.log(`user ${userId} already voted for ${vote} in survey ${surveyId}`);
            return
          }
          console.log(`user ${userId} changed vote from ${existingVote.vote} to ${vote} in survey ${surveyId}`);
          //todo update database
          existingVote.vote = vote;
        } else {
          survey.votes = [...survey.votes, { user: { id: userId }, vote }];
        }
      }
    }
  }
})
