const fs = require('fs');

const filePath = '/media/vane/Movies/Projects/zenith/src/app/club-management/page.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements for theme classes
const replacements = [
  // Loading/Error backgrounds
  ['bg-gray-50 dark:bg-gray-900', 'bg-zenith-main'],
  
  // Text colors
  ['text-gray-400', 'text-zenith-muted'],
  ['text-gray-900 dark:text-white', 'text-zenith-primary'],
  ['text-gray-600 dark:text-gray-400', 'text-zenith-secondary'],
  
  // Role badge colors (update member role to zenith theme)
  ['bg-gray-100 text-gray-800 border-gray-200', 'bg-zenith-section text-zenith-secondary border-zenith-border'],
  
  // Card backgrounds
  ['bg-white dark:bg-gray-800', 'bg-zenith-card'],
  ['border-gray-200 dark:border-gray-700', 'border-zenith-border'],
];

// Apply replacements
replacements.forEach(([oldClass, newClass]) => {
  content = content.split(oldClass).join(newClass);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('Club management theme updated successfully!');
console.log('Updated theme classes:');
replacements.forEach(([old, newClass]) => {
  console.log(`  ${old} -> ${newClass}`);
});
