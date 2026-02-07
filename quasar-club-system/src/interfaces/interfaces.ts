import { SurveyTypes } from '@/enums/SurveyTypes'

// ============================================================
// Enums
// ============================================================

export enum SurveyStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  AWAITING_VERIFICATION = 'awaiting_verification'
}

// ============================================================
// User & Auth
// ============================================================

export interface IUser {
  uid: string
  email: string | null
  name?: string
  displayName?: string
  createdAt: Date
  photoURL?: string
}

export interface ICredentials {
  email: string
  password: string
  name?: string
}

// ============================================================
// Team
// ============================================================

export interface ITeam {
  id?: string
  name: string
  creator: string
  powerusers: string[]
  members: string[]
  invitationCode: string
  surveys: string[]
  cashboxTransactions?: ICashboxTransaction[]
}

export interface ICashboxTransaction {
  id?: string
  amount: number
  description: string
  date: string | Date
  createdBy: string
}

export interface ITeamInvitation {
  id?: string
  teamId: string
  teamName: string
  inviterId: string
  inviterName: string
  inviteeId: string
  inviteeEmail: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Date
  respondedAt?: Date
}

// ============================================================
// Survey & Voting
// ============================================================

export interface ISurvey {
  id?: string
  createdDate?: string // Timestamp as string (UNIX)
  date: string // Survey date in YYYY-MM-DD format
  dateTime: Date
  description: string
  teamId: string
  time: string // Time as string (HH:MM)
  title: string
  type: SurveyTypes
  votes: IVote[]
  status?: SurveyStatus
  verifiedAt?: Date
  verifiedBy?: string // UID of Power User who verified
}

export interface IVote {
  userUid: string
  vote: boolean // true = positive, false = negative
}

export interface ISurveyNotificationData {
  id: string
  title: string
  teamId: string
  teamMembers: string[]
}

// ============================================================
// Notifications & Messages
// ============================================================

export interface INotification {
  id: string
  userId: string
  type: 'team_invitation' | 'survey_created' | 'survey_reminder'
  title: string
  message: string
  read: boolean
  createdAt: Date
  teamId?: string
  surveyId?: string
  invitationId?: string
  status?: 'pending' | 'accepted' | 'declined'
}

export interface IMessage {
  id: string
  content: string
  authorId: string
  authorName: string
  teamId: string
  createdAt: Date
}

// ============================================================
// Metrics (used by composables)
// ============================================================

export interface ITeamMetrics {
  totalSurveys: number
  totalMembers: number
  averageParticipation: number
  activeSurveys: number
}

export interface IPlayerMetrics {
  yesVotes: number
  noVotes: number
  unvoted: number
  averageParticipation: number
}

export interface IPersonalMetrics {
  myTotalVotes: number
  myYesVotes: number
  personalParticipationRate: number
}

export interface IMemberStats {
  totalSurveys: number
  yesVotes: number
  noVotes: number
  unvoted: number
  participationRate: number
  attendanceRate: number
}

// ============================================================
// Chart helpers
// ============================================================

export interface IChartData {
  labels: string[]
  datasets: IChartDataset[]
}

export interface IChartDataset {
  label?: string
  data: (number | null)[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  tension?: number
  fill?: boolean
  pointStyle?: string
  pointRadius?: number
  showLine?: boolean
}

export interface IChartOptions {
  responsive?: boolean
  maintainAspectRatio?: boolean
  plugins?: Record<string, unknown>
  scales?: Record<string, unknown>
}

// ============================================================
// Team member (UI display)
// ============================================================

export interface ITeamMember {
  uid: string
  displayName?: string
  email?: string
  name?: string
  photoURL?: string
}

export interface IPlayerOption {
  label: string
  value: string | null
}
