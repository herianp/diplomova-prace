import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./firebase-admin-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// User UID to add to team
const userUID = 'XdoZ3tGN8jN3vsijZcy9FCj3HB62'; // jirka@test.cz
const teamId = 'ZT1KbriwPZJBGkyX0Uvs'; // Xaverov team ID

async function addUserToTeam() {
  console.log('🏆 Adding jirka to Xaverov team...\n');
  
  try {
    // Get current team document
    const teamRef = firestore.collection('teams').doc(teamId);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      console.error('❌ Team not found!');
      return;
    }
    
    const teamData = teamDoc.data();
    const currentMembers = teamData.members || [];
    
    console.log(`📋 Current team has ${currentMembers.length} members`);
    
    // Add new user to members array
    const updatedMembers = [...currentMembers, userUID];
    
    // Update team document
    await teamRef.update({
      members: updatedMembers
    });
    
    console.log(`✅ Added jirka to team`);
    console.log(`📊 Team now has ${updatedMembers.length} members total`);
    
    // Also update user's teams array
    try {
      const userRef = firestore.collection('users').doc(userUID);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userTeams = userData.teams || [];
        
        if (!userTeams.includes(teamId)) {
          await userRef.update({
            teams: [...userTeams, teamId]
          });
          console.log(`✅ Added team to jirka's profile`);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating user ${userUID}:`, error.message);
    }
    
    console.log('\n🎉 Jirka successfully added to Xaverov team!');
    
  } catch (error) {
    console.error('❌ Error adding user to team:', error.message);
  }
}

addUserToTeam().catch(console.error);