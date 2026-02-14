import {
  collection,
  query,
  where,
  limit,
  startAfter,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  getDocs,
  arrayUnion,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { INotification } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { ListenerError } from '@/errors'

export function useNotificationFirebase() {
  /**
   * Listen to notifications for a user (real-time)
   */
  const listenToNotifications = (
    userId: string,
    pageSize: number,
    onData: (notifications: INotification[], lastDoc: DocumentSnapshot | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe => {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(pageSize)
    )

    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as INotification[]
      const last = snapshot.docs[snapshot.docs.length - 1] || null
      onData(notifications, last)
    }, (error) => {
      const listenerError = new ListenerError('notifications', 'errors.listener.failed', { code: error.code })
      console.error('Error loading notifications:', listenerError.message)
      if (onError) onError(listenerError)
    })
  }

  /**
   * Load more notifications with pagination
   */
  const loadMoreNotifications = async (
    userId: string,
    lastDoc: DocumentSnapshot,
    pageSize: number
  ): Promise<{ notifications: INotification[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> => {
    try {
      const moreQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        startAfter(lastDoc),
        limit(pageSize)
      )

      const snapshot = await getDocs(moreQuery)
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as INotification[]

      return {
        notifications,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      console.error('Error loading more notifications:', firestoreError.message)
      throw firestoreError
    }
  }

  /**
   * Mark a single notification as read
   */
  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error marking notification as read:', firestoreError.message)
      throw firestoreError
    }
  }

  /**
   * Mark multiple notifications as read (batch)
   */
  const markAllNotificationsAsRead = async (notificationIds: string[]): Promise<void> => {
    try {
      const batch = writeBatch(db)

      notificationIds.forEach(id => {
        const notificationRef = doc(db, 'notifications', id)
        batch.update(notificationRef, {
          read: true,
          readAt: new Date()
        })
      })

      await batch.commit()
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error marking all notifications as read:', firestoreError.message)
      throw firestoreError
    }
  }

  /**
   * Respond to a team invitation (accept/decline)
   */
  const respondToInvitation = async (
    notification: INotification,
    response: 'accepted' | 'declined',
    currentUserId: string
  ): Promise<void> => {
    try {
      const batch = writeBatch(db)

      // Update the team invitation
      const invitationRef = doc(db, 'teamInvitations', notification.invitationId!)
      batch.update(invitationRef, {
        status: response,
        respondedAt: new Date()
      })

      if (response === 'accepted') {
        // Add user to team
        const teamRef = doc(db, 'teams', notification.teamId!)
        batch.update(teamRef, {
          members: arrayUnion(currentUserId)
        })
      }

      // Update notification
      const notificationRef = doc(db, 'notifications', notification.id!)
      batch.update(notificationRef, {
        status: response,
        read: true
      })

      await batch.commit()
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error responding to invitation:', firestoreError.message)
      throw firestoreError
    }
  }

  /**
   * Create a new notification
   */
  const createNotification = async (notification: Partial<INotification>): Promise<void> => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: new Date()
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error creating notification:', firestoreError.message)
      throw firestoreError
    }
  }

  return {
    listenToNotifications,
    loadMoreNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    respondToInvitation,
    createNotification
  }
}
