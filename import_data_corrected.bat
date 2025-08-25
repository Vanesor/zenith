@echo off
REM =============================================================================
REM Windows Batch Script to Import Data into Zenith Database (Corrected Version)
REM =============================================================================
REM This script runs the PostgreSQL import using zenithpostgres user
REM Make sure you're in the project directory before running this
REM =============================================================================

echo ====================================================================== 
echo Starting Zenith Database Data Import (Corrected)
echo ======================================================================

REM Check if we're in the right directory
if not exist "db_export\insert_scripts" (
    echo ERROR: db_export\insert_scripts folder not found!
    echo Please run this script from the zenith project root directory.
    pause
    exit /b 1
)

if not exist "import_data_corrected.sql" (
    echo ERROR: import_data_corrected.sql file not found!
    echo Please make sure import_data_corrected.sql is in the current directory.
    pause
    exit /b 1
)

echo Found required files. Starting import...
echo.
echo Using the corrected import script that matches your actual SQL files.
echo This version handles each file individually without transactions.
echo.

REM Run the corrected import script
psql -U zenithpostgres -d zenith < import_data_corrected.sql

REM Check if the command was successful
if %ERRORLEVEL% equ 0 (
    echo.
    echo ====================================================================== 
    echo Data import completed!
    echo ======================================================================
    echo The import process finished. Check the output above for any issues.
    echo Note: Empty SQL files or missing tables are normal and expected.
) else (
    echo.
    echo ====================================================================== 
    echo Import process completed with some issues.
    echo ======================================================================
    echo Please check the error messages above.
)

echo.
echo You can now connect to your database with:
echo psql -U zenithpostgres -d zenith
echo.

pause
