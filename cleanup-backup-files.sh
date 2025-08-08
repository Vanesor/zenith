#!/bin/bash

# Script to clean up backup files in the Zenith project
# Created: August 8, 2025

echo "=== Zenith Project Backup File Cleanup Tool ==="
echo "This script will identify and remove unnecessary backup files."
echo

# Counter for statistics
total_backup_files=0
removed_files=0
kept_files=0
error_files=0

# Function to check and delete backup files
check_and_delete_backup() {
  local extension=$1
  local description=$2
  
  echo "Searching for $description files..."
  
  # Find all backup files with the given extension
  while IFS= read -r backup_file; do
    if [ -z "$backup_file" ]; then
      continue
    fi
    
    ((total_backup_files++))
    
    # Get the original file path by removing the extension
    original_file="${backup_file%.$extension}"
    
    echo "Found: $backup_file"
    
    # Check if the original file exists
    if [ -f "$original_file" ]; then
      # Before deleting, check if the backup file might be referenced elsewhere
      echo "  Checking if this backup file is referenced in the project..."
      if grep -q -r --include="*.{js,jsx,ts,tsx,json,md}" "$(basename "$backup_file")" . \
          --exclude-dir=node_modules \
          --exclude-dir=.git \
          --exclude-dir=.next; then
        echo "  ! This backup file appears to be referenced elsewhere in the project."
        echo "  Do you want to delete it anyway? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
          rm "$backup_file"
          if [ $? -eq 0 ]; then
            echo "  ✓ Successfully removed $backup_file"
            ((removed_files++))
          else
            echo "  ✗ Failed to remove $backup_file"
            ((error_files++))
          fi
        else
          echo "  Keeping file as requested."
          ((kept_files++))
        fi
      else
        echo "  Original file exists and backup is not referenced elsewhere."
        rm "$backup_file"
        if [ $? -eq 0 ]; then
          echo "  ✓ Successfully removed $backup_file"
          ((removed_files++))
        else
          echo "  ✗ Failed to remove $backup_file"
          ((error_files++))
        fi
      fi
    else
      echo "  ! Original file not found. Checking if this file is referenced elsewhere..."
      if grep -q -r --include="*.{js,jsx,ts,tsx,json,md}" "$(basename "$backup_file")" . \
          --exclude-dir=node_modules \
          --exclude-dir=.git \
          --exclude-dir=.next; then
        echo "  ! This file appears to be referenced in the project. Keeping for safety."
        ((kept_files++))
      else
        echo "  ! Original file not found, but file is not referenced elsewhere."
        echo "  Do you want to delete it? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
          rm "$backup_file"
          if [ $? -eq 0 ]; then
            echo "  ✓ Successfully removed $backup_file"
            ((removed_files++))
          else
            echo "  ✗ Failed to remove $backup_file"
            ((error_files++))
          fi
        else
          echo "  Keeping file as requested."
          ((kept_files++))
        fi
      fi
    fi
  done < <(find . -type f -name "*.$extension" | sort)
  
  echo "Finished processing $description files."
  echo
}

# Function to handle test component variations
handle_test_components() {
  echo "Checking test component variations..."
  
  # Define directories to check for test files
  dirs=("./src/components/test" "./src/components")
  
  # Define patterns for test file variations
  patterns=("*_Broken*.tsx" "*_Old*.tsx" "*_Fixed*.tsx" "*_New*.tsx" "*_backup*.tsx")
  
  # Track the main/canonical component files
  declare -A main_components
  
  # First, identify all main component files
  for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
      for file in "$dir"/*.tsx; do
        if [[ -f "$file" && ! "$file" =~ (_Broken|_Old|_Fixed|_New|_backup) ]]; then
          base_name=$(basename "$file" .tsx)
          main_components["$base_name"]=1
        fi
      done
    fi
  done
  
  # Now identify and process test variations
  for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
      for pattern in "${patterns[@]}"; do
        for file in "$dir"/$pattern; do
          if [ -f "$file" ]; then
            ((total_backup_files++))
            echo "Found test variant: $file"
            
            # Extract base component name (remove suffix like _Broken, _Fixed, etc.)
            base_name=$(basename "$file" .tsx | sed -E 's/_Broken.*|_Old.*|_Fixed.*|_New.*|_backup.*//g')
            
            # Check if we have a main component file
            if [ -n "${main_components[$base_name]}" ]; then
              echo "  Main component exists: ${base_name}.tsx. This is likely a test variant."
              
              # Check if this file is imported or referenced anywhere
              echo "  Checking if this component is referenced elsewhere in the project..."
              if grep -q -r --include="*.{js,jsx,ts,tsx}" "$(basename "$file")" . \
                  --exclude-dir=node_modules \
                  --exclude-dir=.git \
                  --exclude-dir=.next; then
                echo "  ! This component appears to be imported or used elsewhere in the project."
                echo "  Do you still want to delete it? (y/n)"
              else
                echo "  This component is not referenced elsewhere in the project."
                echo "  Do you want to delete it? (y/n)"
              fi
              
              read -r response
              if [[ "$response" =~ ^[Yy]$ ]]; then
                rm "$file"
                if [ $? -eq 0 ]; then
                  echo "  ✓ Successfully removed $file"
                  ((removed_files++))
                else
                  echo "  ✗ Failed to remove $file"
                  ((error_files++))
                fi
              else
                echo "  Keeping file as requested."
                ((kept_files++))
              fi
            else
              echo "  No main component found. This might be the primary version."
              
              # Check if this file is imported or referenced anywhere
              echo "  Checking if this component is referenced elsewhere in the project..."
              if grep -q -r --include="*.{js,jsx,ts,tsx}" "$(basename "$file")" . \
                  --exclude="$file" \
                  --exclude-dir=node_modules \
                  --exclude-dir=.git \
                  --exclude-dir=.next; then
                echo "  ! This component appears to be imported or used elsewhere in the project."
                echo "  Keeping file for safety."
              else
                echo "  This component is not referenced elsewhere in the project."
                echo "  Do you want to delete it? (y/n)"
                read -r response
                if [[ "$response" =~ ^[Yy]$ ]]; then
                  rm "$file"
                  if [ $? -eq 0 ]; then
                    echo "  ✓ Successfully removed $file"
                    ((removed_files++))
                  else
                    echo "  ✗ Failed to remove $file"
                    ((error_files++))
                  fi
                else
                  echo "  Keeping file as requested."
                  ((kept_files++))
                fi
              fi
              ((kept_files++))
            fi
          fi
        done
      done
    fi
  done
  
  echo "Finished checking test component variations."
  echo
}

# Navigate to the project root directory
cd "$(dirname "$0")" || exit 1

# Function to check important configuration backups
check_important_backups() {
  echo "Checking for important configuration backups..."
  
  # List of important configuration files that might be backups
  important_patterns=(
    ".env.backup"
    "*.config.*.backup"
    "database/schema.backup.sql"
    "*.conf.backup"
    "nginx.conf.backup"
    "docker-compose.*.backup"
  )
  
  for pattern in "${important_patterns[@]}"; do
    for file in $(find . -name "$pattern" 2>/dev/null); do
      echo "Found potentially important backup: $file"
      echo "This appears to be a configuration backup and might be important."
      echo "Do you want to keep this file? (Y/n)"
      read -r response
      if [[ "$response" =~ ^[Nn]$ ]]; then
        rm "$file"
        if [ $? -eq 0 ]; then
          echo "  ✓ Removed $file as requested"
          ((removed_files++))
        else
          echo "  ✗ Failed to remove $file"
          ((error_files++))
        fi
      else
        echo "  Keeping important backup file for safety"
        ((kept_files++))
      fi
    done
  done
  
  echo "Finished checking important configuration backups."
  echo
}

# Process different types of backup files
check_important_backups
check_and_delete_backup "backup" "standard backup"
check_and_delete_backup "manual_backup" "manual backup"
check_and_delete_backup "old" "old version"
check_and_delete_backup "bak" "backup"
check_and_delete_backup "copy" "copy"

# Handle test component variations
handle_test_components

# Print summary statistics
echo "=== Backup Cleanup Summary ==="
echo "Total backup files found: $total_backup_files"
echo "Files removed: $removed_files"
echo "Files kept (no original found or manual decision): $kept_files"
echo "Files with errors during removal: $error_files"

if [ $kept_files -gt 0 ]; then
  echo
  echo "WARNING: $kept_files backup files were kept because:"
  echo "- Their original files could not be found"
  echo "- You chose to keep them during the interactive process"
  echo "- They were determined to be potentially necessary"
  echo "You may want to examine these files manually to determine if they're needed."
fi

echo
echo "Cleanup completed!"
echo
echo "NOTE: The environment file './judge0-ce/.env.backup' was kept because there is no corresponding"
echo ".env file. This is likely an important backup that should be preserved."
