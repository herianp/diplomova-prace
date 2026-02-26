import { useNotificationFirebase } from '@/services/notificationFirebase'
import { INotification } from '@/interfaces/interfaces'
import { useI18n } from 'vue-i18n'

export const useNotifications = () => {
  const notificationFirebase = useNotificationFirebase()
  const { t } = useI18n()

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
      title: t('notifications.invitation.title', { teamName: invitation.teamName }),
      message: t('notifications.invitation.message', { inviterName: invitation.inviterName, teamName: invitation.teamName }),
      teamId: invitation.teamId,
      invitationId: invitation.id,
      status: 'pending',
      teamName: invitation.teamName,
      inviterName: invitation.inviterName
    }
    return await createNotification(notificationData)
  }

  const createSurveyNotification = async (survey: { id: string; type: string; teamId: string; opponent?: string }, userIds: string[]): Promise<void> => {
    const typeLabel = t(`survey.type.${survey.type}`)
    const surveyTypeLabel = (survey.type === 'match' || survey.type === 'friendly-match') && survey.opponent
      ? `${typeLabel} (${survey.opponent})`
      : typeLabel
    const notifications = userIds.map(userId => ({
      userId,
      type: 'survey_created' as const,
      title: t('notifications.survey.title'),
      message: t('notifications.survey.message', { type: surveyTypeLabel }),
      surveyId: survey.id,
      teamId: survey.teamId,
      surveyType: survey.type
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
