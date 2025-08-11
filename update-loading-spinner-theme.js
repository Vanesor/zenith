const fs = require('fs');

const filePath = '/media/vane/Movies/Projects/zenith/src/components/assignment/LoadingSpinner.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements for theme classes
const replacements = [
  // Spinner colors
  ['text-blue-600 dark:text-blue-400', 'text-zenith-brand'],
  
  // Text colors
  ['text-gray-600 dark:text-gray-400', 'text-zenith-secondary'],
  ['text-gray-900 dark:text-white', 'text-zenith-primary'],
  
  // Backdrop
  ['bg-white/80 dark:bg-gray-900/80', 'bg-zenith-main/80'],
  
  // Modal background
  ['bg-white dark:bg-gray-800', 'bg-zenith-card'],
  
  // Spinner background
  ['bg-blue-100 dark:bg-blue-900/20', 'bg-zenith-brand/10'],
  
  // Border colors
  ['border-blue-200 dark:border-blue-800', 'border-zenith-brand/30'],
];

// Apply replacements
replacements.forEach(([oldClass, newClass]) => {
  content = content.split(oldClass).join(newClass);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('LoadingSpinner theme updated successfully!');
console.log('Updated theme classes:');
replacements.forEach(([old, newClass]) => {
  console.log(`  ${old} -> ${newClass}`);
});
