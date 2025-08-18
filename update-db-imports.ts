/**
 * Migration Helper Script for Zenith
 * This script helps update imports across the codebase to use the new db.ts file.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Directories to search for files that need updating
const SEARCH_DIRS = [
  'src/app',
  'src/lib',
  'src/components',
  'src/contexts',
  'src/hooks',
];

// Extensions to look for
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Old imports to replace
const OLD_IMPORTS = [
  `import { prismaClient } from "@/lib/database"`,
  `import { prismaClient as prisma } from "@/lib/database"`,
  `import { prismaClient as prisma } from '@/lib/database'`,
  `import { prismaClient } from '@/lib/database'`,
  `import db from "@/lib/database"`,
  `import db from '@/lib/database'`,
  `import { db } from "@/lib/database"`,
  `import { db } from '@/lib/database'`,
  `import { PrismaClient } from '@prisma/client'`,
  `import { PrismaClient } from "@prisma/client"`,
  `import * as database from '@/lib/database'`,
  `import * as database from "@/lib/database"`,
];

// New import to use
const NEW_IMPORT = `import { db } from '@/lib/db'`;

// Function to walk directories and find files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main function
async function main() {
  console.log('Starting database import migration helper...');
  
  let filesToProcess = [];
  
  // Find all files to process
  for (const dir of SEARCH_DIRS) {
    if (fs.existsSync(dir)) {
      const files = findFiles(dir);
      filesToProcess = [...filesToProcess, ...files];
    }
  }
  
  console.log(`Found ${filesToProcess.length} files to check.`);
  
  // Track stats
  let filesUpdated = 0;
  let importsReplaced = 0;
  
  // Process each file
  for (const filePath of filesToProcess) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileUpdated = false;
    
    for (const oldImport of OLD_IMPORTS) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport, 'g'), NEW_IMPORT);
        importsReplaced++;
        fileUpdated = true;
      }
    }
    
    // Also replace prismaClient usage with db
    if (content.includes('prismaClient') || content.includes('prisma.')) {
      content = content.replace(/prismaClient\./g, 'db.');
      content = content.replace(/prisma\./g, 'db.');
      fileUpdated = true;
    }
    
    if (fileUpdated) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesUpdated++;
      console.log(`Updated: ${filePath}`);
    }
  }
  
  console.log('\n===== SUMMARY =====');
  console.log(`Files checked: ${filesToProcess.length}`);
  console.log(`Files updated: ${filesUpdated}`);
  console.log(`Imports replaced: ${importsReplaced}`);
  console.log('===================\n');
  
  console.log('Done! You may need to manually check some files and update additional database references.');
}

main().catch(error => {
  console.error('Error running migration helper:', error);
  process.exit(1);
});
