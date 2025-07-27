# Field Name Standardization Plan

## Database Schema & TypeScript Interface Changes

The database schema uses `event_date` and `event_time` columns in the `events` table. We've updated the TypeScript interface and database queries to match this convention:

```typescript
export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: Date;   // Changed from 'date'
  event_time: string; // Changed from 'time'
  // ...other fields
}
```

## Files Updated

1. ✅ `/src/lib/database.ts` - Updated Event interface
2. ✅ `/src/lib/database.ts` - Updated createEvent function
3. ✅ `/src/app/api/events/route.ts` - Updated event creation API
4. ✅ `/src/app/club-management/page.tsx` - Updated state variable and form fields
5. ✅ `/src/app/api/clubs/[clubId]/management/route.ts` - Updated SQL query
6. ✅ `/src/app/api/dashboard/route.ts` - Updated data mapping
7. ✅ `/src/app/api/clubs/[clubId]/route.ts` - Updated event filtering

## Files Still To Update

The following files still reference the old field names:

1. `/src/app/dashboard/page.tsx` - Uses `event.date` and `event.time`
2. `/src/app/events/page.tsx` - Uses `event.date` and `event.time`
3. `/src/app/clubs/[clubId]/page.tsx` - Uses `event.date` and `event.time`
4. `/src/app/clubs/[clubId]/page_new.tsx` - Uses `event.date` and `event.time`
5. `/src/app/calendar/page.tsx` - Uses `event.date` for filtering and display
6. `/src/app/management/page.tsx` - Uses `event.date` and `event.time`
7. `/src/app/page.tsx` - Uses `event.date`

## Standardization Plan

1. **API Layer Transformation**:
   - All API endpoints should return standardized field names
   - Backend should use `event_date` and `event_time` for database operations
   - Frontend data models should match this convention

2. **Frontend Component Updates**:
   - Update all TypeScript interfaces to use `event_date` and `event_time`
   - Modify component rendering to use the new field names
   - Update form handling to use the new field names

3. **Documentation**:
   - Create a clear naming convention guide
   - Document the database schema and field naming patterns

## Implementation Strategy

1. First update API layer to ensure data flows correctly
2. Update key components one by one
3. Test each component after updates
4. Verify all features work with the new field names

## Recommended Next Steps

1. Use a script to batch update remaining references:
   ```bash
   find ./src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/event\.date/event.event_date/g'
   find ./src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/event\.time/event.event_time/g'
   ```

2. Fix any TypeScript errors that arise from the changes
3. Test the application thoroughly to ensure all event-related functionality works correctly
