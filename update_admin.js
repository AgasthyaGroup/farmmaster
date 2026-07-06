const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    // Update all users to set status: true
    await User.updateMany({}, { $set: { status: true } });
    const users = await User.find({});
    console.log("Updated users in DB:", users.map(u => ({ id: u.userId, email: u.email, role: u.role, status: u.status })));
    mongoose.disconnect();
  });
