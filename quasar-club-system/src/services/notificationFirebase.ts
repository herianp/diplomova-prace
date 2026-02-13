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
      console.error('Error loading notifications:', error)
      if (onError) onError(error as Error)
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
  }

  /**
   * Mark a single notification as read
   */
  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: new Date()
    })
  }

  /**
   * Mark multiple notifications as read (batch)
   */
  const markAllNotificationsAsRead = async (notificationIds: string[]): Promise<void> => {
    const batch = writeBatch(db)

    notificationIds.forEach(id => {
      const notificationRef = doc(db, 'notifications', id)
      batch.update(notificationRef, {
        read: true,
        readAt: new Date()
      })
    })

    await batch.commit()
  }

  /**
   * Respond to a team invitation (accept/decline)
   */
  const respondToInvitation = async (
    notification: INotification,
    response: 'accepted' | 'declined',
    currentUserId: string
  ): Promise<void> => {
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
  }

  /**
   * Create a new notification
   */
  const createNotification = async (notification: Partial<INotification>): Promise<void> => {
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      read: false,
      createdAt: new Date()
    })
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
