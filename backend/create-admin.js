require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const email = 'admin@codapt.com';
    const password = 'CodApt123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      `INSERT INTO users (name, username, email, password_hash, role, status) 
       VALUES ('Admin User', 'admin', ?, ?, 'admin', 'active')
       ON DUPLICATE KEY UPDATE role='admin', password_hash=?`,
      [email, hashedPassword, hashedPassword]
    );
    
    console.log('✅ Admin created/updated successfully');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   You can now login to the admin panel with these credentials');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
