const fs = require('fs');

const filePath = '/media/vane/Movies/Projects/zenith/src/components/ProfileModal.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements for theme classes
const replacements = [
  // Status badge styles
  ['bg-gray-100 text-gray-700', 'bg-zenith-section text-zenith-secondary'],
  
  // Modal container
  ['bg-white dark:bg-gray-800', 'bg-zenith-card'],
  
  // Border colors
  ['border-gray-200 dark:border-gray-700', 'border-zenith-border'],
  
  // Hover states for buttons
  ['hover:bg-gray-200 dark:hover:bg-gray-700', 'hover:bg-zenith-hover'],
  
  // Tab button states
  ['text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300', 'text-zenith-secondary hover:text-zenith-primary'],
];

// Apply replacements
replacements.forEach(([oldClass, newClass]) => {
  content = content.split(oldClass).join(newClass);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('ProfileModal theme updated successfully!');
console.log('Updated theme classes:');
replacements.forEach(([old, newClass]) => {
  console.log(`  ${old} -> ${newClass}`);
});
