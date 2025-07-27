#!/bin/bash

# Script to update event field names across the codebase
# This script replaces references to old field names with the standardized names

echo "Starting field name standardization..."

# Replace event.date references
echo "Updating event.date references to event.event_date"
find ./src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/event\.date/event.event_date/g'

# Replace event.time references
echo "Updating event.time references to event.event_time"
find ./src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/event\.time/event.event_time/g'

# Replace date column references in SQL queries
echo "Updating 'date' SQL column references to 'event_date'"
find ./src -type f -name "*.ts" | xargs sed -i 's/\([^_]\)date\s*[><!=]\{1,2\}\s*CURRENT_DATE/\1event_date \2 CURRENT_DATE/g'
find ./src -type f -name "*.ts" | xargs sed -i 's/ORDER BY date/ORDER BY event_date/g'

# Replace time column references in SQL queries
echo "Updating 'time' SQL column references to 'event_time'"
find ./src -type f -name "*.ts" | xargs sed -i 's/ORDER BY time/ORDER BY event_time/g'

echo "Field name standardization complete!"
echo "Please check for any TypeScript errors and fix them manually."
