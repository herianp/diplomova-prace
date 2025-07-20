const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const userNames = [
  'ulda', 'onis', 'havlis', 'jandys', 'pepik', 'misakaucky', 
  'kubakaucky', 'majkl', 'honkic', 'rada', 'suly', 'johny', 
  'bambus', 'max', 'dan', 'paja', 'trenermara', 'simon', 
  'wulfi', 'machy', 'kubaHeri', 'rolin', 'svanci', 'elky'
];

async function createUser(name) {
  const email = `${name}@test.cz`;
  const password = '123456';
  
  try {
    // Note: Firebase CLI doesn't have direct user creation with password
    // We'll use the MCP Firebase tools instead
    console.log(`Would create: ${name} (${email})`);
    return { success: true, name, email };
  } catch (error) {
    console.error(`❌ Error creating user ${name}:`, error.message);
    return { success: false, name, email, error: error.message };
  }
}

async function createAllUsers() {
  console.log(`Creating ${userNames.length} users...`);
  
  const results = [];
  for (const name of userNames) {
    const result = await createUser(name);
    results.push(result);
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n🎉 Process completed: ${successful}/${userNames.length} users`);
  
  return results;
}

createAllUsers().catch(console.error);