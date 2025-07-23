import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./firebase-admin-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// User UIDs to add to team
const userUIDs = [
  'uoYwOPYILhWyKfXEATFcXjLpYi82', // jakubskopek@test.cz
  'X42cyY93OJNryZJ56SZCOpkncHk2'  // tetoo@test.cz
];

const teamId = 'ZT1KbriwPZJBGkyX0Uvs'; // Xaverov team ID

async function addUsersToTeam() {
  console.log('🏆 Adding users to Xaverov team...\n');
  
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
    
    // Add new users to members array
    const updatedMembers = [...currentMembers, ...userUIDs];
    
    // Update team document
    await teamRef.update({
      members: updatedMembers
    });
    
    console.log(`✅ Added ${userUIDs.length} new users to team`);
    console.log(`📊 Team now has ${updatedMembers.length} members total`);
    
    // Also update each user's teams array
    for (const uid of userUIDs) {
      try {
        const userRef = firestore.collection('users').doc(uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          const userTeams = userData.teams || [];
          
          if (!userTeams.includes(teamId)) {
            await userRef.update({
              teams: [...userTeams, teamId]
            });
            console.log(`✅ Added team to user ${uid} profile`);
          }
        }
      } catch (error) {
        console.error(`❌ Error updating user ${uid}:`, error.message);
      }
    }
    
    console.log('\n🎉 All users successfully added to Xaverov team!');
    
  } catch (error) {
    console.error('❌ Error adding users to team:', error.message);
  }
}

addUsersToTeam().catch(console.error);