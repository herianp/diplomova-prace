import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK (reuse existing initialization)
const serviceAccount = JSON.parse(readFileSync('./firebase-admin-key.json', 'utf8'));

// Only initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();

const teamId = 'ZT1KbriwPZJBGkyX0Uvs';
const teamName = 'Xaverov';

const userEmails = [
  'ulda@test.cz', 'onis@test.cz', 'havlis@test.cz', 'jandys@test.cz', 
  'pepik@test.cz', 'misakaucky@test.cz', 'kubakaucky@test.cz', 'majkl@test.cz', 
  'honkic@test.cz', 'rada@test.cz', 'suly@test.cz', 'johny@test.cz', 
  'bambus@test.cz', 'max@test.cz', 'dan@test.cz', 'paja@test.cz', 
  'trenermara@test.cz', 'simon@test.cz', 'wulfi@test.cz', 'machy@test.cz', 
  'kubaHeri@test.cz', 'rolin@test.cz', 'svanci@test.cz', 'elky@test.cz'
];

async function getUserUidByEmail(email) {
  try {
    const usersSnapshot = await firestore.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      return usersSnapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error(`Error finding user ${email}:`, error.message);
    return null;
  }
}

async function addUsersToTeam() {
  console.log(`Adding ${userEmails.length} users to team ${teamName} (${teamId})...`);
  
  try {
    // Get current team data
    const teamRef = firestore.collection('teams').doc(teamId);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      console.error(`❌ Team ${teamId} not found!`);
      return;
    }
    
    const teamData = teamDoc.data();
    const currentMembers = teamData.members || [];
    
    console.log(`📋 Current team has ${currentMembers.length} members`);
    
    // Get UIDs for all users
    const userUids = [];
    for (const email of userEmails) {
      const uid = await getUserUidByEmail(email);
      if (uid) {
        if (!currentMembers.includes(uid)) {
          userUids.push(uid);
          console.log(`✅ Found user: ${email} -> ${uid}`);
        } else {
          console.log(`⚠️  User ${email} already in team`);
        }
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }
    
    if (userUids.length === 0) {
      console.log('No new users to add to team.');
      return;
    }
    
    // Add all users to team members array
    const updatedMembers = [...currentMembers, ...userUids];
    
    await teamRef.update({
      members: updatedMembers
    });
    
    console.log(`🎉 Successfully added ${userUids.length} users to team ${teamName}!`);
    console.log(`📊 Team now has ${updatedMembers.length} total members`);
    
  } catch (error) {
    console.error('❌ Error adding users to team:', error.message);
  }
}

addUsersToTeam().catch(console.error);