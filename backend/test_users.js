// Test script to check if users exist in database
require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose');
const User = require('./models/userModel');

mongoose.connect(process.env.DB_LOCAL_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    const users = await User.find({}).select('_id name email telegramChatId');
    
    console.log('\n📊 Total users in database:', users.length);
    console.log('\n👥 Users:');
    users.forEach(user => {
      console.log(`  - ID: ${user._id}`);
      console.log(`    Name: ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Telegram: ${user.telegramChatId || 'Not connected'}`);
      console.log('');
    });
    
    if (users.length === 0) {
      console.log('⚠️  No users found! Please register an account first on the website.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
