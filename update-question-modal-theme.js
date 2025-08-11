const fs = require('fs');

const filePath = '/media/vane/Movies/Projects/zenith/src/components/assignment/QuestionPreviewModal.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements for theme classes
const replacements = [
  // Text colors
  ['text-gray-900 dark:text-white', 'text-zenith-primary'],
  ['text-gray-600 dark:text-gray-400', 'text-zenith-secondary'],
  ['text-gray-400 hover:text-gray-600 dark:hover:text-gray-300', 'text-zenith-muted hover:text-zenith-secondary'],
  
  // Background and modal colors
  ['bg-white dark:bg-gray-800', 'bg-zenith-card'],
  ['border-gray-200 dark:border-gray-700', 'border-zenith-border'],
  
  // Code block backgrounds
  ['bg-gray-50 dark:bg-gray-800', 'bg-zenith-section'],
  ['border-l-gray-300 dark:border-l-gray-600', 'border-l-zenith-border'],
  
  // Button styles
  ['bg-blue-600 hover:bg-blue-700', 'bg-zenith-brand hover:bg-zenith-brand-dark'],
  ['bg-gray-300 hover:bg-gray-400', 'bg-zenith-muted hover:bg-zenith-accent'],
];

// Apply replacements
replacements.forEach(([oldClass, newClass]) => {
  content = content.split(oldClass).join(newClass);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('QuestionPreviewModal theme updated successfully!');
console.log('Updated theme classes:');
replacements.forEach(([old, newClass]) => {
  console.log(`  ${old} -> ${newClass}`);
});
