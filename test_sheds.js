const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/anm');
const db = mongoose.connection;
db.once('open', async () => {
  const sheds = await db.collection('sheds').find({}).toArray();
  console.log(JSON.stringify(sheds, null, 2));
  process.exit();
});
