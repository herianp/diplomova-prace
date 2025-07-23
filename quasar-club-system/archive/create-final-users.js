import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./firebase-admin-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

// New users to create
const users = [
  'jakubskopek',
  'tetoo'
];

async function createUsers() {
  console.log('🔥 Creating Firebase users...\n');
  
  const createdUsers = [];
  
  for (const name of users) {
    try {
      const email = `${name}@test.cz`;
      const password = '123456';
      
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name
      });
      
      console.log(`✅ Created user: ${email} (UID: ${userRecord.uid})`);
      
      // Create user document in Firestore
      await firestore.collection('users').doc(userRecord.uid).set({
        email: email,
        displayName: name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        teams: []
      });
      
      console.log(`📄 Created Firestore document for: ${email}`);
      
      createdUsers.push({
        uid: userRecord.uid,
        email: email,
        displayName: name
      });
      
    } catch (error) {
      console.error(`❌ Error creating user ${name}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Successfully created ${createdUsers.length} users:`);
  createdUsers.forEach(user => {
    console.log(`   • ${user.displayName} (${user.email}) - UID: ${user.uid}`);
  });
  
  return createdUsers;
}

createUsers().catch(console.error);