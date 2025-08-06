const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin SDK (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-project-id.firebaseio.com"
  });
}

const db = admin.firestore();

async function addDanHrotakToTeam() {
  try {
    const teamId = 'ZT1KbriwPZJBGkyX0Uvs'; // Xaverov team ID
    const danHrotakUid = '7IaKJV1j3GYmwyRvB2cEgG9G7412'; // UID from user creation
    
    console.log('Adding danHrotak to Xaverov team...');
    
    // Get current team document
    const teamRef = db.collection('teams').doc(teamId);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      throw new Error('Team not found');
    }
    
    const teamData = teamDoc.data();
    const currentMembers = teamData.members || [];
    
    // Check if user is already in team
    if (currentMembers.includes(danHrotakUid)) {
      console.log('User is already in the team');
      return;
    }
    
    // Add user to team members array
    const updatedMembers = [...currentMembers, danHrotakUid];
    
    await teamRef.update({
      members: updatedMembers,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Successfully added danHrotak to team');
    console.log('Team now has', updatedMembers.length, 'members');
    
  } catch (error) {
    console.error('Error adding user to team:', error);
    throw error;
  }
}

// Run the function
addDanHrotakToTeam()
  .then(() => {
    console.log('Successfully added danHrotak to Xaverov team');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to add user to team:', error);
    process.exit(1);
  });