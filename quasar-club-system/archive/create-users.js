import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./firebase-admin-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

const userNames = [
  'ulda', 'onis', 'havlis', 'jandys', 'pepik', 'misakaucky', 
  'kubakaucky', 'majkl', 'honkic', 'rada', 'suly', 'johny', 
  'bambus', 'max', 'dan', 'paja', 'trenermara', 'simon', 
  'wulfi', 'machy', 'kubaHeri', 'rolin', 'svanci', 'elky'
];

async function createUsers() {
  console.log(`Creating ${userNames.length} users...`);
  
  for (const name of userNames) {
    try {
      const email = `${name}@test.cz`;
      const password = '123456';
      
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: false
      });
      
      // Create user document in Firestore
      await firestore.collection('users').doc(userRecord.uid).set({
        email: email,
        displayName: name,
        uid: userRecord.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Created user: ${name} (${email}) - UID: ${userRecord.uid}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User ${name}@test.cz already exists`);
      } else {
        console.error(`❌ Error creating user ${name}:`, error.message);
      }
    }
  }
  
  console.log('\n🎉 User creation process completed!');
}

createUsers().catch(console.error);