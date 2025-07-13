import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/firebase/config.ts'

export const useNotifications = () => {
  
  const createNotification = async (notification) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  const createTeamInvitationNotification = async (invitation) => {
    const notificationData = {
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

  const createSurveyNotification = async (survey, userIds) => {
    const notifications = userIds.map(userId => ({
      userId,
      type: 'survey_created',
      title: 'New Survey',
      message: `New survey "${survey.title}" has been created`,
      surveyId: survey.id,
      teamId: survey.teamId
    }))

    // Batch create notifications
    const promises = notifications.map(notification => createNotification(notification))
    await Promise.all(promises)
  }

  return {
    createNotification,
    createTeamInvitationNotification,
    createSurveyNotification
  }
}