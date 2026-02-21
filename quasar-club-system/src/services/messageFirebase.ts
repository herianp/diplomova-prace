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
import { mapFirestoreError } from '@/errors/errorMapper'
import { ListenerError } from '@/errors'
import { createLogger } from 'src/utils/logger'

const log = createLogger('messageFirebase')

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
      const listenerError = new ListenerError('messages', 'errors.listener.failed', { code: error.code })
      log.error('Messages listener failed', { teamId, code: error.code, error: listenerError.message })
      if (onError) onError(listenerError)
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
    try {
      await addDoc(collection(db, 'messages'), {
        content,
        authorId,
        authorName,
        teamId,
        createdAt: serverTimestamp()
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to send message', { teamId, authorId, error: firestoreError.message })
      throw firestoreError
    }
  }

  return {
    listenToMessages,
    sendMessage
  }
}
