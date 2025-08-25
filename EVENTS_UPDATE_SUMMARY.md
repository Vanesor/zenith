# Events Data Update Summary

## Overview
This update includes dummy events data for all 4 clubs and replaces the "altogether" club with "artovert" (a creative arts club).

## Files Created/Updated

### 1. Main Scripts
- **`insert_dummy_events.sql`** - Main script to insert events and update club data
- **`insert_events_data.bat`** - Windows batch script to run the insertion
- **`backup_events_data.sql`** - Backup script to save current data before changes

### 2. Data Files Updated
- **`db_export/csv/clubs.csv`** - Updated altogether → artovert
- **`db_export/csv/events_updated.csv`** - New events data (8 events total)
- **`db_export/insert_scripts/clubs.sql`** - Updated club insert script
- **`db_export/insert_scripts/events_updated.sql`** - New events insert script

### 3. Code Updates
- **`src/app/homeclub/[clubId]/page.tsx`** - Added Palette icon import and mapping

## Events Data Structure

### Each Club Gets:
- **1 Past Event** (status: 'completed') - July 2025
- **1 Upcoming Event** (status: 'upcoming') - September 2025

### Club Event Details:

#### ASCEND (Technical Club)
- **Past:** Algorithm Challenge Championship (July 15, 2025)
- **Upcoming:** Web Development Bootcamp (September 10, 2025)

#### ASTER (Soft Skills Club)
- **Past:** Public Speaking Mastery (July 20, 2025)
- **Upcoming:** Leadership Excellence Summit (September 15, 2025)

#### ACHIEVERS (Higher Studies Club)
- **Past:** Graduate School Preparation Workshop (July 25, 2025)
- **Upcoming:** Research Methodology & Academic Writing (September 20, 2025)

#### ARTOVERT (Creative Arts Club - formerly altogether)
- **Past:** Digital Art Showcase (July 18, 2025)
- **Upcoming:** Creative Arts Workshop Series (September 25, 2025)

## Club Update: altogether → artovert

### Changes Made:
- **ID:** altogether → artovert
- **Name:** ALTOGETHER → ARTOVERT
- **Type:** Overall Development → Creative Arts
- **Description:** Updated to focus on visual arts and design
- **Icon:** Target → Palette
- **Color:** orange → from-pink-500 to-purple-600

## How to Use

### Option 1: Run Complete Script
```cmd
insert_events_data.bat
```

### Option 2: Manual Steps
```cmd
# Backup current data (optional)
psql -U zenithpostgres -d zenith < backup_events_data.sql

# Insert new events data
psql -U zenithpostgres -d zenith < insert_dummy_events.sql
```

### Option 3: Import from Updated Files
```cmd
# Use the corrected import script with updated data
import_data_corrected.bat
```

## Verification Queries

After running the scripts, verify with:

```sql
-- Check updated clubs
SELECT id, name, type FROM clubs ORDER BY name;

-- Check new events
SELECT 
    e.title,
    c.name as club_name,
    e.status,
    e.event_date,
    e.location
FROM events e
JOIN clubs c ON e.club_id = c.id
ORDER BY c.name, e.event_date;
```

## Event Features Included

Each event includes:
- ✅ Realistic titles and descriptions
- ✅ Appropriate venues and capacities
- ✅ Banner images (Unsplash URLs)
- ✅ Gallery images for past events
- ✅ Proper timestamps
- ✅ Status (completed/upcoming)
- ✅ Club-specific content

## Notes

- All events have realistic dates (past events in July 2025, upcoming in September 2025)
- Banner images are high-quality Unsplash photos relevant to each event type
- Gallery images are included for completed events to show event memories
- Event capacities range from 50-150 attendees based on venue and event type
- All events are created by the respective club coordinators
- The script includes proper transaction handling with BEGIN/COMMIT

## Next Steps

You can now:
1. Run the insertion script to populate your database
2. Customize any event details as needed
3. Add more events using the same structure
4. Update the TypeScript file to handle the new club data structure
