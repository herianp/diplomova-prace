import { SurveyTypes } from '../enums/SurveyTypes'

export interface ISurvey {
  id?: string; // Optional, Firestore assigns it automatically
  createdDate?: string; // Timestamp as string (UNIX)
  date: string; // Survey date in YYYY-MM-DD format
  dateTime: Date; // Full Date object
  description: string;
  teamId: string; // Reference to the team
  time: string; // Time as string (HH:MM)
  title: string;
  type: SurveyTypes; // Enum for survey type
  votes: IVote[]; // Array of votes
}

// Vote Interface
export interface IVote {
  userUid: string;
  vote: boolean; // true = positive, false = negative
}

export interface ICredentials {
  email: string;
  password: string;
  name?: string;
}
