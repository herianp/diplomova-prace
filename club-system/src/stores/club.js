import {defineStore} from 'pinia'
import {db} from "@/js/firebase.js";
import { collection, onSnapshot,
    doc, deleteDoc, updateDoc, addDoc,
    arrayUnion, arrayRemove,
    query, orderBy
} from "firebase/firestore";
import {useClubComposable} from "@/use/useClubComposable.js";

export const useClubStore = defineStore({
    id: 'club',
    state: () => ({
        clubName: 'Club Name',
        activeSurveys: [],
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
            const surveysCollection = collection(db, "surveys");
            const queryByDateTime = query(surveysCollection, orderBy("dateTime", "asc"));
            // keep listening to changes [sorted by id]
            onSnapshot(queryByDateTime, (querySnapshot) => {
                let surveys = [];
                querySnapshot.forEach((doc) => {
                    let survey = {
                        id: doc.id,
                        date: doc.data().date,
                        time: doc.data().time,
                        dateTime: doc.data().dateTime,
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
            // Todo add autoID
            console.log(`added survey ${newSurvey.title} ${newSurvey.description} ${newSurvey.date} ${newSurvey.time}`);

            const currentDate = new Date().getTime().toString();

            await addDoc(collection(db, "surveys"), {
                createdDate: currentDate,
                date: newSurvey.date,
                time: newSurvey.time,
                title: newSurvey.title,
                dateTime: newSurvey.dateTime,
                description: newSurvey.description,
                votes: [],
            })

            console.log("Document written with ID:");
        },
        async deleteActiveSurvey(surveyId) {
            await deleteDoc(doc(db, "surveys", surveyId));
        },
        async updateActiveSurvey(surveyId, newTitle, newDescription, newDate, newTime) {
            const useClub= useClubComposable();

            const survey = this.activeSurveys.find(s => s.id === surveyId);

            if (survey){
                await updateDoc(db, "surveys", surveyId, {
                    title: newTitle,
                    description: newDescription,
                    date: newDate,
                    time: newTime,
                    dateTime: useClub.getDateByDateAndTime(newDate, newTime),
                });
            }
        },
        async addVote(surveyId, userId, vote) {
            const survey = this.activeSurveys.find(s => s.id === surveyId);
            if (survey) {
                const existingVote = survey.votes.find(v => v.user.uid === userId);
                const surveyRef = doc(db, "surveys", surveyId);
                if (existingVote) {
                    if (existingVote.vote === vote) {
                        console.log(`user ${userId} already voted for ${vote} in survey ${surveyId}`);
                        return
                    }
                    console.log(`user ${userId} changed vote from ${existingVote.vote} to ${vote} in survey ${surveyId}`);
                    //todo update database

                    // Remove the existing vote in Firestore and add the updated vote
                    await updateDoc(surveyRef, {
                        votes: arrayRemove({ user: { uid: userId }, vote: existingVote.vote })
                    });
                    await updateDoc(surveyRef, {
                        votes: arrayUnion({ user: { uid: userId }, vote })
                    });

                } else {
                    await updateDoc(surveyRef, {
                        votes: arrayUnion({ user: { uid: userId }, vote })
                    });
                }
            }
        }
    }
})
