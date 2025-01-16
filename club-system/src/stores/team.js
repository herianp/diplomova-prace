import {defineStore} from "pinia";
import {
    addDoc, arrayRemove, arrayUnion,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    getDoc
} from "firebase/firestore";
import {db} from "@/js/firebase.js";
import {reactive, ref} from "vue";
import {useTeamComposable} from "@/use/useTeamComposable.js";

export const useTeamStore = defineStore({
    id: 'team',
    state: () => ({
        teams: reactive([]), // I cant use .value here because it is not a ref, ref is for single values, reactive is for arrays and objects
        surveys: reactive([]),
        editedSurvey: ref(null),
        currentTeam: ref(null),
    }),
    getters: {
        getPositiveVotes: (state) => (surveyId) => {
            return state.surveys.find(survey => survey.id === surveyId).votes.filter(vote => vote.vote).length;
        },
        getNegativeVotes: (state) => (surveyId) => {
            return state.surveys.find(survey => survey.id === surveyId).votes.filter(vote => !vote.vote).length;
        },
        getSurveyById: (state) => (surveyId) => {
            return state.surveys.find(survey => survey.id === surveyId);
        },
    },
    actions: {
        async createTeam(teamName, userId) {
            try {
                console.log(`added team ${teamName} : ${userId}`);
                await addDoc(collection(db, "teams"), {
                    name: teamName,
                    creator: userId,
                    powerusers: [userId],
                    members: [userId],
                    invitationCode: this.invitationCodeGenerator(),
                    surveys: [],
                })
            } catch (e) {
                console.error(`Error adding document: ${e}`);
            }
            console.log("Team created:");
        },
        invitationCodeGenerator() {
            return Math.random().toString(36).substring(2, 8).toUpperCase();
        },
        async getTeamsByUserId(userId) {
            console.log(`Getting teams for user: ${userId}`);
            const teamsQuery = query(
                collection(db, "teams"),
                where("members", "array-contains", userId)
            );
            console.log("Teams query:", JSON.stringify(teamsQuery));
            // Listen for real-time updates
            onSnapshot(teamsQuery, (snapshot) => {
                const teams = [];
                snapshot.forEach((doc) => {
                    teams.push({ id: doc.id, ...doc.data() });
                });
                console.log("Teams the user belongs to:", teams);
                this.teams = teams;
            });

        },
        async getTeamById(teamId) {
            try {
                const teamRef = await doc(db, "teams", teamId);
                const teamDoc = await getDoc(teamRef);
                if (teamDoc.exists()) {
                    console.log("Team data:", teamDoc.data());
                    this.currentTeam = { ...teamDoc.data() };
                } else {
                    console.log("No such team document!");
                }
            } catch (error) {
                console.error("Error getting team document:", error);
            }
        },
        async getSurveysByTeamId(teamId) {
            try {
                const surveysQuery = query(
                    collection(db, "surveys"),
                    where("teamId", "==", teamId) // Filter surveys by teamId
                );

                onSnapshot(surveysQuery, (snapshot) => {
                    const surveys = [];
                    snapshot.forEach((doc) => {
                        surveys.push({ id: doc.id, ...doc.data() });
                    });
                    console.log("Teams the user belongs to:", surveys);
                    this.surveys = surveys;
                });
            } catch (error) {
                console.error("Error fetching surveys in real-time:", error);
            }
        },
        async deleteSurvey(surveyId) {
            try {
                await deleteDoc(doc(db, "surveys", surveyId));
            } catch (error) {
                console.error("Error deleting survey:", error);
            }
        },
        async addSurvey(newSurvey) {
            const currentDate = new Date().getTime().toString();

            await addDoc(collection(db, "surveys"), {
                createdDate: currentDate,
                date: newSurvey.date,
                time: newSurvey.time,
                title: newSurvey.title,
                dateTime: newSurvey.dateTime,
                description: newSurvey.description,
                teamId: newSurvey.teamId,
                votes: [],
            })
            console.log("Document written with ID:");
        },
        async updateSurvey(surveyId, newTitle, newDescription, newDate, newTime) {
            const useClub = useTeamComposable();
            try {
                await updateDoc(doc(db, "surveys", surveyId), {
                    title: newTitle,
                    description: newDescription,
                    date: newDate,
                    time: newTime,
                    dateTime: useClub.getDateByDateAndTime(newDate, newTime),
                });
            } catch (error) {
                console.error("Error updating survey:", error);
            }
        },
        async addVote(surveyId, userUid, newVote) {
            const survey = this.surveys.find(s => s.id === surveyId);
            console.log(`survey ${JSON.stringify(survey)}`);
            if (survey) {
                const existingVote = survey.votes.find(v => v.userUid === userUid);
                const votes = survey.votes || [];
                const surveyRef = doc(db, "surveys", surveyId);
                console.log(`existing vote ${JSON.stringify(existingVote)}`);
                if (existingVote) {
                    if (existingVote.vote === newVote) {
                        console.log(`user ${userUid} already voted for ${newVote} in survey ${surveyId}`);
                        return
                    }
                    console.log(`user ${userUid} changed vote from ${existingVote.vote} to ${newVote} in survey ${surveyId}`);

                    const updatedVotes = votes.map((vote) =>
                        vote.userUid === userUid ? { ...vote, vote: newVote } : vote
                    );

                    await updateDoc(surveyRef, { votes: updatedVotes });

                } else {
                    console.log('jere')
                    const updatedVotes = [...votes, { userUid: userUid, vote: newVote }];
                    await updateDoc(surveyRef, { votes: updatedVotes });
                }
            }
        },
        clearData() {
            this.teams = [];
            this.surveys = [];
            this.currentTeam = null;
        }
    },
});
