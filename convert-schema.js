// convert-schema.js - Script to convert Prisma schema to use camelCase with @map attributes
const fs = require('fs');
const path = require('path');

// Read the schema file
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Function to convert snake_case to camelCase
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
}

// Process the schema
let models = schema.match(/model\s+\w+\s+{[\s\S]+?}/g) || [];
let updatedModels = [];

models.forEach(model => {
  const modelName = model.match(/model\s+(\w+)/)[1];
  console.log(`Converting model: ${modelName}`);
  
  // Get all field definitions in the model
  let lines = model.split('\n');
  let modelStart = lines[0];
  let modelEnd = lines[lines.length - 1];
  let fieldLines = lines.slice(1, -1);
  
  // Process each field line
  let updatedFieldLines = fieldLines.map(line => {
    // Skip relation lines, comments, indexes, etc.
    if (!line.trim() || line.trim().startsWith('//') || line.trim().startsWith('@') || 
        line.trim().startsWith('@@') || !line.includes(' ')) {
      return line;
    }
    
    // Extract field parts - this is a simplified version and may need adjustments
    const parts = line.trim().match(/^(\w+)(\s+)(\w+)(.*)$/);
    if (!parts) return line;
    
    const [, fieldName, spaces, fieldType, rest] = parts;
    
    // Skip if already camelCase or special cases
    if (!fieldName.includes('_') || fieldName === 'id' || 
        fieldName === 'created_at' || fieldName === 'updated_at') {
      
      // For common cases like created_at, updated_at, add @map automatically
      if (fieldName === 'created_at') {
        if (!rest.includes('@map')) {
          return `  createdAt${spaces}${fieldType}${rest} @map("created_at")`;
        }
      } else if (fieldName === 'updated_at') {
        if (!rest.includes('@map')) {
          return `  updatedAt${spaces}${fieldType}${rest} @map("updated_at")`;
        }
      } else {
        return line;
      }
    }
    
    // Convert field name to camelCase
    const camelCaseFieldName = snakeToCamel(fieldName);
    
    // Check if there's already an @map attribute
    if (rest.includes('@map')) {
      return line;
    }
    
    // Add @map attribute
    return `  ${camelCaseFieldName}${spaces}${fieldType}${rest} @map("${fieldName}")`;
  });
  
  // Reconstruct the model
  updatedModels.push([modelStart, ...updatedFieldLines, modelEnd].join('\n'));
});

// Replace models in the original schema
updatedModels.forEach(updatedModel => {
  const modelName = updatedModel.match(/model\s+(\w+)/)[1];
  const regex = new RegExp(`model\\s+${modelName}\\s+{[\\s\\S]+?}`, 'g');
  schema = schema.replace(regex, updatedModel);
});

// Write the updated schema back to file
const backupPath = path.join(__dirname, 'prisma', 'schema.prisma.backup');
fs.writeFileSync(backupPath, fs.readFileSync(schemaPath)); // Make a backup
fs.writeFileSync(schemaPath, schema);

console.log(`Schema updated! Backup saved to ${backupPath}`);
console.log('Run "npx prisma generate" to update the Prisma Client.');
