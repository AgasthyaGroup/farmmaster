const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({});
    console.log("Found users:", users.map(u => ({ id: u.userId, email: u.email, role: u.role })));
    mongoose.disconnect();
  });
