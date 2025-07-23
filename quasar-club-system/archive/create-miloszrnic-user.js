import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./firebase-admin-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

async function createUser() {
  console.log('🔥 Creating Firebase user: miloszrnic...\n');
  
  try {
    const name = 'miloszrnic';
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
    
    console.log(`\n🎉 Successfully created user:`);
    console.log(`   • ${name} (${email}) - UID: ${userRecord.uid}`);
    
    return {
      uid: userRecord.uid,
      email: email,
      displayName: name
    };
    
  } catch (error) {
    console.error(`❌ Error creating user miloszrnic:`, error.message);
  }
}

createUser().catch(console.error);