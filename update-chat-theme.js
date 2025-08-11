const fs = require('fs');

const filePath = '/media/vane/Movies/Projects/zenith/src/app/chat/page.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements for theme classes
const replacements = [
  // Loading background
  ['bg-gray-50 dark:bg-gray-900', 'bg-zenith-main'],
  
  // Text colors
  ['text-gray-500 dark:text-gray-400', 'text-zenith-secondary'],
  ['text-gray-600 dark:text-gray-400', 'text-zenith-secondary'],
  ['text-gray-900 dark:text-white', 'text-zenith-primary'],
  
  // Room list items
  ['border-gray-200 dark:border-gray-700', 'border-zenith-border'],
  ['hover:bg-gray-50 dark:hover:bg-gray-750', 'hover:bg-zenith-hover'],
  
  // Selected room highlight
  ['bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600', 'bg-zenith-brand/10 border-l-4 border-l-zenith-brand'],
  
  // Keep other theme color indicators as they are for visual distinction
  ['text-green-600 dark:text-green-400', 'text-emerald-500 dark:text-emerald-400'],
  ['text-blue-600 dark:text-blue-400', 'text-blue-500 dark:text-blue-400'],  
  ['text-purple-600 dark:text-purple-400', 'text-purple-500 dark:text-purple-400'],
];

// Apply replacements
replacements.forEach(([oldClass, newClass]) => {
  content = content.split(oldClass).join(newClass);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('Chat page theme updated successfully!');
console.log('Updated theme classes:');
replacements.forEach(([old, newClass]) => {
  console.log(`  ${old} -> ${newClass}`);
});
