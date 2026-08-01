const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/farmmaster';

async function seed() {
  console.log('Connecting to local MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  const db = mongoose.connection.db;

  // Clear existing products and categories
  console.log('Clearing old products and categories...');
  await db.collection('categories').deleteMany({});
  await db.collection('products').deleteMany({});

  // 1. Insert Categories
  console.log('Inserting Categories...');
  const categoriesData = [
    {
      name: 'Milk',
      code: 'MILK',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
      volume: '500ml',
      price: 38,
      description: 'Fresh and pure milk sourced daily from our farm.',
      benefits: ['Rich in Calcium', 'Essential Vitamin D', 'High protein for growth'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Ghee & Butter',
      code: 'GHEE',
      image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600',
      volume: '500g',
      price: 350,
      description: 'Traditional Desi Ghee made with the Bilona method.',
      benefits: ['Aromatic & Tasty', 'Boosts Immunity', 'Great for digestion'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Curd & Paneer',
      code: 'DAIRY',
      image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=600',
      volume: '200g',
      price: 90,
      description: 'Thick farm fresh curd and soft premium paneer.',
      benefits: ['Rich in probiotics', '100% natural', 'No preservatives added'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const categoriesInsert = await db.collection('categories').insertMany(categoriesData);
  console.log('Seeded Categories successfully!');

  // Retrieve inserted category IDs
  const milkCategory = await db.collection('categories').findOne({ code: 'MILK' });
  const gheeCategory = await db.collection('categories').findOne({ code: 'GHEE' });
  const dairyCategory = await db.collection('categories').findOne({ code: 'DAIRY' });

  // 2. Insert Products
  console.log('Inserting Products...');
  const productsData = [
    {
      name: 'A2 Cow Milk',
      sku: 'MILK-A2-500',
      price: 45,
      quantity: 100,
      size: '500 ml',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=600',
      description: 'Easy to digest pure A2 cow milk sourced from premium indigenous cows.',
      benefits: ['Easy digestion', 'Natural nutrients intact', 'No additives'],
      status: 'active',
      categoryId: milkCategory._id,
      categoryName: milkCategory.name,
      categoryCode: milkCategory.code,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Full Cream Milk',
      sku: 'MILK-FC-500',
      price: 38,
      quantity: 150,
      size: '500 ml',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
      description: 'Rich, pasteurized full cream milk perfect for tea, coffee, and daily usage.',
      benefits: ['Creamy texture', 'Great for sweets & beverages', 'Energy booster'],
      status: 'active',
      categoryId: milkCategory._id,
      categoryName: milkCategory.name,
      categoryCode: milkCategory.code,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Pure Desi Cow Ghee',
      sku: 'GHEE-COW-500',
      price: 350,
      quantity: 80,
      size: '500 ml',
      image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600',
      description: 'Pure cow ghee prepared traditionally, giving it a rich aroma and granular texture.',
      benefits: ['Rich aroma', 'Perfect for cooking & sweets', 'Healthy fats'],
      status: 'active',
      categoryId: gheeCategory._id,
      categoryName: gheeCategory.name,
      categoryCode: gheeCategory.code,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Fresh Paneer',
      sku: 'PNR-200',
      price: 90,
      quantity: 60,
      size: '200 g',
      image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=600',
      description: 'Super soft, fresh cottage cheese (Paneer) packed under hygienic conditions.',
      benefits: ['High protein content', 'Soft & delicious', 'Freshly prepared'],
      status: 'active',
      categoryId: dairyCategory._id,
      categoryName: dairyCategory.name,
      categoryCode: dairyCategory.code,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Thick Farm Curd',
      sku: 'CURD-500',
      price: 35,
      quantity: 120,
      size: '500 g',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600',
      description: 'Thick, creamy set curd containing live cultures, great for digestion.',
      benefits: ['Probiotic rich', 'Perfect thickness', 'Cooling & refreshing'],
      status: 'active',
      categoryId: dairyCategory._id,
      categoryName: dairyCategory.name,
      categoryCode: dairyCategory.code,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await db.collection('products').insertMany(productsData);
  console.log('Seeded Products successfully!');

  await mongoose.disconnect();
  console.log('Disconnected. Seeding finished.');
}

seed().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
