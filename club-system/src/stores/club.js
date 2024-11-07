import {defineStore} from 'pinia'
import {db} from "@/js/firebase.js";
import { collection, getDocs, onSnapshot, setDoc, doc } from "firebase/firestore";

export const useClubStore = defineStore({
    id: 'club',
    state: () => ({
        clubName: 'Club Name',
        activeSurveys: [],
        // activeSurveys: [
        //     {
        //         'title': 'Survey 1', 'id': 1, 'description': 'Umělka, úterý 18:00',
        //         'votes': [
        //             {'user': {'id': 1, 'name': 'user_1'}, 'vote': false},
        //             {'user': {'id': 2, 'name': 'user_2'}, 'vote': true},
        //             {'user': {'id': 3, 'name': 'user_3'}, 'vote': true},
        //             {'user': {'id': 4, 'name': 'user_4'}, 'vote': true},
        //         ]
        //     },
        //     {
        //         'title': 'Survey 2', 'id': 2, 'description': 'Umělka, úterý 18:00',
        //         'votes': [
        //             {'user': {'id': 1, 'name': 'user_1'}, 'vote': true},
        //             {'user': {'id': 2, 'name': 'user_2'}, 'vote': false},
        //             {'user': {'id': 3, 'name': 'user_3'}, 'vote': true},
        //             {'user': {'id': 4, 'name': 'user_4'}, 'vote': true},
        //             {'user': {'id': 5, 'name': 'user_5'}, 'vote': false},
        //         ]
        //     },
        //     {
        //         'title': 'Survey 3', 'id': 3, 'description': 'Umělka, úterý 18:00',
        //         'votes': [
        //             {'user': {'id': 1, 'name': 'user_1'}, 'vote': true},
        //         ]
        //     },
        //     {
        //         'title': 'Survey 4', 'id': 4, 'description': 'Umělka, úterý 18:00',
        //         'votes': [
        //             {'user': {'id': 1, 'name': 'user_1'}, 'vote': false},
        //             {'user': {'id': 2, 'name': 'user_2'}, 'vote': false},
        //             {'user': {'id': 3, 'name': 'user_3'}, 'vote': true},
        //         ]
        //     },
        //     {
        //         'title': 'Survey 5', 'id': 5, 'description': 'Umělka, úterý 18:00',
        //         'votes': [
        //             {'user': {'id': 1, 'name': 'user_1'}, 'vote': false},
        //             {'user': {'id': 2, 'name': 'user_2'}, 'vote': false},
        //         ]
        //     },
        // ],
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
        async getActiveSurveys() {
            // const querySnapshot = await getDocs(collection(db, "surveys"));
            // querySnapshot.forEach((doc) => {
            //     let survey = {
            //         id: doc.id,
            //         title: doc.data().title,
            //         description: doc.data().description,
            //         votes:doc.data().votes,
            //     };
            //     // console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
            //     console.log(`${doc.id} => ${JSON.stringify(survey)}`);
            //     this.activeSurveys = [...this.activeSurveys, survey];
            // });

            // keep listening to changes
            onSnapshot(collection(db, "surveys"), (querySnapshot) => {
                let surveys = [];
                querySnapshot.forEach((doc) => {
                    let survey = {
                        id: doc.id,
                        title: doc.data().title,
                        description: doc.data().description,
                        votes:doc.data().votes,
                    };
                    surveys.push(survey)
                });
                this.activeSurveys = surveys;
            });
        },
        async addActiveSurvey(newSurvey) {
            // this.activeSurveys = [...this.activeSurveys, survey];
            // Todo add autoID
            console.log(`added survey ${newSurvey.title} ${newSurvey.description} ${newSurvey.date} ${newSurvey.time}`);
            await setDoc(doc(db, "surveys", new Date().getTime().toString()), {
                date: newSurvey.date,
                time: newSurvey.time,
                title: newSurvey.title,
                description: newSurvey.description,
                votes: [],
            });

            // const docRef = await addDoc(collection(db, ""), {
            //     name: "Tokyo",
            //     country: "Japan"
            // });
            console.log("Document written with ID:");
        },
        deleteActiveSurvey(surveyId) {
            this.activeSurveys = this.activeSurveys.filter(s => s.id !== surveyId);
        },
        updateActiveSurvey(surveyId, newTitle, newDescription, newDate, newTime) {
            const survey = this.activeSurveys.find(s => s.id === surveyId);
            if (survey) {
                survey.title = newTitle;
                survey.description = newDescription;
                survey.date = newDate;
                survey.time = newTime;
            }
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
                    survey.votes = [...survey.votes, {user: {id: userId}, vote}];
                }
            }
        }
    }
})
