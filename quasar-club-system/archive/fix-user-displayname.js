import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./firebase-admin-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function fixUserDisplayName() {
  const userId = 'hVWFsXd8ROgtELRRHndR1BFUEzF3'; // herianek@seznam.cz
  
  try {
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log('❌ User document not found');
      return;
    }
    
    const userData = userDoc.data();
    console.log('📋 Current user data:', userData);
    
    // Update the document to add displayName field
    await userRef.update({
      displayName: 'Petis' // From Firebase Auth
    });
    
    console.log('✅ Successfully added displayName field to user document');
    
    // Verify the update
    const updatedDoc = await userRef.get();
    console.log('📋 Updated user data:', updatedDoc.data());
    
  } catch (error) {
    console.error('❌ Error updating user document:', error.message);
  }
}

fixUserDisplayName().catch(console.error);