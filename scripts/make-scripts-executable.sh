#!/bin/bash
# Make all migration scripts executable

# Find all bash scripts in the scripts directory
SCRIPTS=$(find ./scripts -name "*.sh")

# Make them executable
for SCRIPT in $SCRIPTS; do
  chmod +x $SCRIPT
  echo "Made executable: $SCRIPT"
done

echo "All migration scripts are now executable."
echo "To run the full migration process, use: ./scripts/run-full-migration.sh"
