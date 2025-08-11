const fs = require('fs');

const filePath = '/media/vane/Movies/Projects/zenith/src/components/test/TestTakingInterface.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements for theme classes
const replacements = [
  // Question status colors (keep defaults as zenith)
  ['bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300', 'bg-zenith-section text-zenith-secondary'],
  
  // Prose styles
  ['prose dark:prose-invert', 'prose dark:prose-invert'],
  
  // Option button backgrounds and hovers
  ['bg-gray-50 dark:bg-gray-700', 'bg-zenith-card'],
  ['hover:bg-gray-100 dark:hover:bg-gray-600', 'hover:bg-zenith-hover'],
  
  // Selected option states
  ['has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20', 'has-[:checked]:bg-zenith-brand/10'],
  ['has-[:checked]:border-blue-500', 'has-[:checked]:border-zenith-brand'],
  
  // Radio button styles
  ['border-gray-300 focus:ring-blue-500', 'border-zenith-border focus:ring-zenith-brand'],
  
  // Text colors
  ['text-gray-900 dark:text-gray-100', 'text-zenith-primary'],
];

// Apply replacements
replacements.forEach(([oldClass, newClass]) => {
  content = content.split(oldClass).join(newClass);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('TestTakingInterface theme updated successfully!');
console.log('Updated theme classes:');
replacements.forEach(([old, newClass]) => {
  console.log(`  ${old} -> ${newClass}`);
});
