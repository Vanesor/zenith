# Database Field Naming Standardization

## Established Convention

For the Zenith project, we're following these database field naming conventions:

1. **Snake Case for SQL Column Names**: All database column names use snake_case (e.g., `event_date`, `event_time`, `club_id`)
2. **Descriptive Prefixes**: When appropriate, column names include the entity name as a prefix (e.g., `event_date` instead of just `date`)
3. **TypeScript Interface Consistency**: TypeScript interfaces will match the database column names exactly to avoid confusion

## Fields Standardized

The following fields have been standardized across the codebase:

| Table   | Standardized Field Names | Old/Inconsistent Names |
|---------|-------------------------|------------------------|
| events  | event_date              | date                   |
| events  | event_time              | time                   |

## Changes Made

1. Updated the TypeScript `Event` interface in `/src/lib/database.ts`
2. Fixed database queries in API routes that were using incorrect column names
3. Updated the event creation API to use the correct field names
4. Updated frontend components to use the standardized field names

## Benefits

- Eliminates runtime errors from mismatched column names
- Improves code readability and consistency
- Makes database queries more reliable
- Simplifies maintenance and future development

## Recommendation for Future Development

When adding new database columns or tables, always follow these guidelines:
- Use snake_case for all database column names
- Use camelCase for TypeScript/JavaScript variables when mapping from the database
- Include entity prefixes when the column name would otherwise be too generic
- Document any naming patterns that differ from these standards
