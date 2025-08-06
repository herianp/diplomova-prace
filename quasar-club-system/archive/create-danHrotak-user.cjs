const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();

async function createDanHrotakUser() {
  try {
    console.log('Creating danHrotak user...');
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: 'danHrotak@test.cz',
      password: '123456',
      displayName: 'danHrotak',
      emailVerified: true
    });

    console.log('User created in Auth:', userRecord);

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: 'danHrotak@test.cz',
      displayName: 'danHrotak',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('User document created in Firestore');
    console.log('User UID:', userRecord.uid);
    
    return userRecord.uid;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Run the function
createDanHrotakUser()
  .then((uid) => {
    console.log('Successfully created danHrotak user with UID:', uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create user:', error);
    process.exit(1);
  });