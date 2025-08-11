const fs = require('fs');

const filePath = '/media/vane/Movies/Projects/zenith/src/app/assignments/create/page.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements for theme classes
const replacements = [
  // Labels
  ['text-gray-700 dark:text-gray-300', 'text-zenith-secondary'],
  
  // Input/Select/Textarea fields
  ['border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white', 'border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary'],
  
  // Readonly/disabled inputs
  ['border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', 'border border-zenith-border rounded-lg bg-zenith-card text-zenith-secondary'],
  
  // Button styles
  ['bg-blue-500 hover:bg-blue-600 text-white', 'bg-zenith-brand hover:bg-zenith-brand-dark text-white'],
  ['bg-gray-500 hover:bg-gray-600 text-white', 'bg-zenith-secondary hover:bg-zenith-accent text-white'],
  ['text-blue-500 hover:text-blue-600', 'text-zenith-brand hover:text-zenith-brand-dark'],
  ['text-red-500 hover:text-red-600', 'text-red-500 hover:text-red-600'], // Keep red for delete actions
  
  // Background colors
  ['bg-gray-50 dark:bg-gray-700', 'bg-zenith-card'],
  ['bg-gray-100 dark:bg-gray-800', 'bg-zenith-card'],
  
  // Text colors
  ['text-gray-600 dark:text-gray-400', 'text-zenith-secondary'],
  ['text-gray-500 dark:text-gray-500', 'text-zenith-muted'],
  ['text-gray-800 dark:text-gray-200', 'text-zenith-primary'],
  
  // Border colors
  ['border-gray-200 dark:border-gray-700', 'border-zenith-border'],
  ['border-gray-300 dark:border-gray-600', 'border-zenith-border'],
  
  // Specific blue borders for special inputs
  ['border-blue-300 dark:border-blue-600', 'border-zenith-brand/30'],
];

// Apply replacements
replacements.forEach(([oldClass, newClass]) => {
  content = content.split(oldClass).join(newClass);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('Assignment create page theme updated successfully!');
console.log('Updated theme classes:');
replacements.forEach(([old, newClass]) => {
  console.log(`  ${old} -> ${newClass}`);
});
