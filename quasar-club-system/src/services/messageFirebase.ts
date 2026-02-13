import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { IMessage } from '@/interfaces/interfaces'

export function useMessageFirebase() {
  /**
   * Listen to messages for a team (real-time)
   */
  const listenToMessages = (
    teamId: string,
    messageLimit: number,
    onData: (messages: IMessage[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe => {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('teamId', '==', teamId),
      limit(messageLimit)
    )

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IMessage[]
      onData(messages)
    }, (error) => {
      console.error('Error loading messages:', error)
      if (onError) onError(error as Error)
    })
  }

  /**
   * Send a new message
   */
  const sendMessage = async (
    teamId: string,
    authorId: string,
    authorName: string,
    content: string
  ): Promise<void> => {
    await addDoc(collection(db, 'messages'), {
      content,
      authorId,
      authorName,
      teamId,
      createdAt: serverTimestamp()
    })
  }

  return {
    listenToMessages,
    sendMessage
  }
}
