const fs = require('fs');
const path = require('path');
const modelsDir = path.join(__dirname, 'src', 'models');
const filesToUpdate = [
  'FeedInventory.ts',
  'MedicineInventory.ts',
  'MilkQuality.ts',
  'MilkCollection.ts',
  'DailyFeeding.ts',
  'TreatmentLog.ts',
  'VaccinationLog.ts',
  'CrossingLog.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('farmId:')) {
    // Insert farmId before timestamps
    content = content.replace(/(\s*)(isDeleted:\s*\{\s*type:\s*Boolean,\s*default:\s*false\s*\})/g, '$1farmId: { type: String, required: false },$1$2');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Skipped ${file} - already has farmId`);
  }
});
