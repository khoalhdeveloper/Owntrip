const mongoose = require('mongoose');
require('dotenv').config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/owntrip');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const AvatarItem = mongoose.model('AvatarItem', new mongoose.Schema({}, { strict: false }));
    const items = await AvatarItem.find();
    console.log('Total items in AvatarItem collection:', items.length);
    if (items.length > 0) {
      console.log('First item:', JSON.stringify(items[0], null, 2));
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

checkDB();
