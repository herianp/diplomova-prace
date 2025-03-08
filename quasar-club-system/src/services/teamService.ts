import { db } from "@/firebase/config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  getDoc,
  getDocs
} from "firebase/firestore";
import { ISurvey } from '../interfaces/interfaces'

// **Create a New Team**
export const createTeam = async (teamName: string, userId: string) => {
  try {
    const newTeam = {
      name: teamName,
      creator: userId,
      powerusers: [userId],
      members: [userId],
      invitationCode: generateInvitationCode(),
      surveys: [],
    };

    await addDoc(collection(db, "teams"), newTeam);
    console.log("Team created:", newTeam);
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
};

// **Generate an Invitation Code**
const generateInvitationCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ✅ Get Teams (Real-time)
export const getTeamsByUserId = (userId: string, callback: (teams: any[]) => void) => {
  const teamsQuery = query(
    collection(db, "teams"),
    where("members", "array-contains", userId)
  );

  return onSnapshot(teamsQuery, (snapshot) => {
    const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(teams);
  });
};

// ✅ Get Surveys (Real-time)
export const getSurveysByTeamId = (teamId: string, callback: (surveys: any[]) => void) => {
  const surveysQuery = query(
    collection(db, "surveys"),
    where("teamId", "==", teamId)
  );

  return onSnapshot(surveysQuery, (snapshot) => {
    const surveys = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log("Team surveys:", surveys);
    callback(surveys);
  });
};

// **Get a Single Team by ID**
export const getTeamById = async (teamId: string) => {
  try {
    const teamRef = doc(db, "teams", teamId);
    const teamDoc = await getDoc(teamRef);

    if (teamDoc.exists()) {
      const teamData = teamDoc.data();

      // Fetch cashbox transactions
      const cashboxTransactionsRef = collection(teamRef, "cashboxTransactions");
      const cashboxTransactionsSnap = await getDocs(cashboxTransactionsRef);
      const cashboxTransactions = cashboxTransactionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { ...teamData, cashboxTransactions };
    } else {
      console.log("No such team document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting team document:", error);
    throw error;
  }
};

// **Delete a Survey**
export const deleteSurvey = async (surveyId: string) => {
  try {
    await deleteDoc(doc(db, "surveys", surveyId));
    console.log(`Survey ${surveyId} deleted.`);
  } catch (error) {
    console.error("Error deleting survey:", error);
    throw error;
  }
};

// **Add a New Survey**
export const addSurvey = async (newSurvey: ISurvey) => {
  try {
    await addDoc(collection(db, "surveys"), {
      ...newSurvey,
      createdDate: new Date().getTime().toString(),
      votes: [],
    });
    console.log("Survey added:", newSurvey);
  } catch (error) {
    console.error("Error adding survey:", error);
    throw error;
  }
};

// **Update Survey Details**
export const updateSurvey = async (surveyId: string, updatedSurvey: any) => {
  try {
    await updateDoc(doc(db, "surveys", surveyId), updatedSurvey);
    console.log(`Survey ${surveyId} updated.`);
  } catch (error) {
    console.error("Error updating survey:", error);
    throw error;
  }
};

// **Add or Update a Vote**
export const addVote = async (surveyId: string, userUid: string, newVote: boolean, votes: any[]) => {
  try {
    const surveyRef = doc(db, "surveys", surveyId);
    const existingVote = votes.find((vote) => vote.userUid === userUid);

    let updatedVotes = votes;

    if (existingVote) {
      if (existingVote.vote === newVote) return;
      updatedVotes = votes.map((vote) => (vote.userUid === userUid ? { ...vote, vote: newVote } : vote));
    } else {
      updatedVotes.push({ userUid, vote: newVote });
    }

    await updateDoc(surveyRef, { votes: updatedVotes });
    console.log("Vote updated for survey:", surveyId);
  } catch (error) {
    console.error("Error adding vote:", error);
    throw error;
  }
};

// **Add a Cashbox Transaction**
export const addCashboxTransaction = async (teamId: string, transactionData: any) => {
  try {
    const cashboxTransactionsRef = collection(doc(db, "teams", teamId), "cashboxTransactions");
    await addDoc(cashboxTransactionsRef, transactionData);
    console.log("Cashbox transaction added:", transactionData);
  } catch (error) {
    console.error("Error adding cashbox transaction:", error);
    throw error;
  }
};
