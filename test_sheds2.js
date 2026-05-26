const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/farmmaster');
const db = mongoose.connection;
db.once('open', async () => {
  const sheds = await db.collection('sheds').find({}).toArray();
  console.log(JSON.stringify(sheds, null, 2));
  process.exit();
});
