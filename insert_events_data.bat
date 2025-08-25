@echo off
REM =============================================================================
REM Script to Insert Dummy Events Data into Zenith Database
REM =============================================================================
REM This script inserts dummy events for all 4 clubs and updates altogether to artovert
REM =============================================================================

echo ====================================================================== 
echo Inserting Dummy Events Data for All Clubs
echo ======================================================================

REM Check if we're in the right directory
if not exist "insert_dummy_events.sql" (
    echo ERROR: insert_dummy_events.sql file not found!
    echo Please make sure you're in the zenith project root directory.
    pause
    exit /b 1
)

echo Found required files. Starting events data insertion...
echo.
echo This will:
echo - Update altogether club to artovert (art club)
echo - Insert 1 past and 1 upcoming event for each of the 4 clubs
echo - Update any existing references to the old club name
echo.

REM Run the events insert script
psql -U zenithpostgres -d zenith < insert_dummy_events.sql

REM Check if the command was successful
if %ERRORLEVEL% equ 0 (
    echo.
    echo ====================================================================== 
    echo Events data insertion completed successfully!
    echo ======================================================================
    echo.
    echo Summary of changes:
    echo - Updated ALTOGETHER club to ARTOVERT ^(Creative Arts club^)
    echo - Added 8 new events ^(2 per club - 1 past, 1 upcoming^)
    echo - Updated all references to use new club name
    echo.
) else (
    echo.
    echo ====================================================================== 
    echo ERROR: Events data insertion failed!
    echo Please check the error messages above.
    echo ======================================================================
)

echo You can verify the changes with:
echo psql -U zenithpostgres -d zenith -c "SELECT c.name, e.title, e.status FROM events e JOIN clubs c ON e.club_id = c.id ORDER BY c.name, e.event_date;"
echo.

pause
