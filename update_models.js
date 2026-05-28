const fs = require('fs');
const path = require('path');

const modelsDir = '/Users/jaswanthreddy/work/farmmaster/src/models';
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Make sure Schema is imported if we are going to use it
  if (!content.includes('{ Schema }') && content.includes('mongoose')) {
    content = content.replace(/import mongoose(.*)from 'mongoose';/, "import mongoose, { Schema } from 'mongoose';");
  } else if (!content.includes('Schema') && !content.includes('mongoose')) {
    content = "import mongoose, { Schema } from 'mongoose';\n" + content;
  }

  // Replace farmId
  if (content.includes('farmId: { type: String')) {
    content = content.replace(/farmId:\s*\{\s*type:\s*String/g, "farmId: { type: Schema.Types.ObjectId, ref: 'Farm'");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
});
