import { useNotificationFirebase } from '@/services/notificationFirebase'
import { INotification } from '@/interfaces/interfaces'

export const useNotifications = () => {
  const notificationFirebase = useNotificationFirebase()

  const createNotification = async (notification: Partial<INotification>): Promise<void> => {
    await notificationFirebase.createNotification(notification)
  }

  const createTeamInvitationNotification = async (invitation: {
    inviteeId: string
    inviterName: string
    teamName: string
    teamId: string
    id: string
  }): Promise<void> => {
    const notificationData: Partial<INotification> = {
      userId: invitation.inviteeId,
      type: 'team_invitation',
      title: 'Team Invitation',
      message: `${invitation.inviterName} invited you to join "${invitation.teamName}"`,
      teamId: invitation.teamId,
      invitationId: invitation.id,
      status: 'pending'
    }
    return await createNotification(notificationData)
  }

  const createSurveyNotification = async (survey: { id: string; title: string; teamId: string }, userIds: string[]): Promise<void> => {
    const notifications = userIds.map(userId => ({
      userId,
      type: 'survey_created' as const,
      title: 'New Survey',
      message: `New survey "${survey.title}" has been created`,
      surveyId: survey.id,
      teamId: survey.teamId
    }))

    const promises = notifications.map(notification => createNotification(notification))
    await Promise.all(promises)
  }

  return {
    createNotification,
    createTeamInvitationNotification,
    createSurveyNotification
  }
}
