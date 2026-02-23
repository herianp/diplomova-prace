import { SurveyTypes } from '@/enums/SurveyTypes'

// ============================================================
// Enums
// ============================================================

export enum SurveyStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  AWAITING_VERIFICATION = 'awaiting_verification'
}

export enum FineRuleTrigger {
  NO_ATTENDANCE = 'no_attendance',
  VOTED_YES_BUT_ABSENT = 'voted_yes_but_absent',
  UNVOTED = 'unvoted'
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
  onboardingCompleted?: boolean
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
}

export interface ITeamSettings {
  chatEnabled: boolean
  address: {
    name: string
    latitude: number
    longitude: number
  }
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
  createdAt: { seconds: number; toDate?: () => Date } | Date
  readAt?: Date
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
  createdAt: { seconds: number; toDate?: () => Date } | Date
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

// ============================================================
// Cashbox & Fines
// ============================================================

export interface IFineRule {
  id?: string
  name: string
  amount: number
  triggerType: FineRuleTrigger
  surveyType?: SurveyTypes | null
  active: boolean
  createdBy: string
  createdAt: Date
}

export interface IFine {
  id?: string
  playerId: string
  amount: number
  reason: string
  source: 'auto' | 'manual'
  ruleId?: string
  surveyId?: string
  surveyTitle?: string
  createdBy: string
  createdAt: Date
}

export interface IPayment {
  id?: string
  playerId: string
  amount: number
  note?: string
  createdBy: string
  createdAt: Date
}

export interface IPlayerBalance {
  playerId: string
  displayName: string
  totalFined: number
  totalPaid: number
  balance: number
}

export interface ICashboxHistoryEntry {
  id?: string
  clearedAt: Date
  clearedBy: string
  summary: {
    totalFined: number
    totalPaid: number
    totalOutstanding: number
    totalCredits: number
    totalFinesCount: number
  }
  playerBalances: IPlayerBalance[]
  fines: Array<{
    playerId: string
    amount: number
    reason: string
    source: string
    createdAt: Date
  }>
  payments: Array<{
    playerId: string
    amount: number
    note?: string
    createdAt: Date
  }>
}

// ============================================================
// Join Requests
// ============================================================

export interface IJoinRequest {
  id?: string
  userId: string
  userDisplayName: string
  userEmail: string
  teamId: string
  teamName: string
  status: 'pending' | 'approved' | 'declined' | 'cancelled'
  createdAt: Date
  respondedAt?: Date
  respondedBy?: string
  respondedByName?: string
}

// ============================================================
// Rate Limiting
// ============================================================

export interface IRateLimitAction {
  key: string            // e.g. 'teamCreation', 'messages', 'joinRequests', 'surveys', 'fines'
  limit: number          // max count
  windowType: 'total' | 'weekly' | 'daily' | 'concurrent'
}

export interface IRateLimitConfig {
  teamCreation: number    // default 5, total
  messages: number        // default 50, weekly
  joinRequests: number    // default 5, concurrent pending
  surveys: number         // default 10, weekly
  fines: number           // default 500, daily per team
}

export interface IUserUsage {
  teamsCreated?: number
  messagesThisWeek?: number
  messagesWeekStart?: Date
  surveysThisWeek?: number
  surveysWeekStart?: Date
  pendingJoinRequests?: number  // computed from query, not stored
}

// ============================================================
// Audit Log
// ============================================================

export type AuditOperation =
  | 'survey.create'
  | 'survey.update'
  | 'survey.delete'
  | 'fine.create'
  | 'fine.update'
  | 'fine.delete'
  | 'member.remove'
  | 'vote.verify'
  | 'joinRequest.approve'
  | 'joinRequest.decline'

export interface IAuditLog {
  id?: string
  teamId: string
  operation: AuditOperation
  actorUid: string
  actorDisplayName: string
  timestamp: Date
  entityId: string
  entityType: 'survey' | 'fine' | 'member' | 'vote'
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
}
