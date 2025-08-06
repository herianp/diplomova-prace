const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();

async function createNagyUser() {
  try {
    console.log('Creating nagy user...');
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: 'nagy@test.cz',
      password: '123456',
      displayName: 'nagy',
      emailVerified: true
    });

    console.log('User created in Auth:', userRecord);

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: 'nagy@test.cz',
      displayName: 'nagy',
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
createNagyUser()
  .then((uid) => {
    console.log('Successfully created nagy user with UID:', uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create user:', error);
    process.exit(1);
  });