@echo off
REM =============================================================================
REM Windows Batch Script to Import Data into Zenith Database
REM =============================================================================
REM This script runs the PostgreSQL import using zenithpostgres user
REM Make sure you're in the project directory before running this
REM =============================================================================

echo ====================================================================== 
echo Starting Zenith Database Data Import
echo ======================================================================

REM Check if we're in the right directory
if not exist "db_export\insert_scripts" (
    echo ERROR: db_export\insert_scripts folder not found!
    echo Please run this script from the zenith project root directory.
    pause
    exit /b 1
)

if not exist "import_data.sql" (
    echo ERROR: import_data.sql file not found!
    echo Please make sure import_data.sql is in the current directory.
    pause
    exit /b 1
)

echo Found required files. Starting import...
echo.

REM Run the import script
psql -U zenithpostgres -d zenith < import_data.sql

REM Check if the command was successful
if %ERRORLEVEL% equ 0 (
    echo.
    echo ====================================================================== 
    echo Data import completed successfully!
    echo ======================================================================
) else (
    echo.
    echo ====================================================================== 
    echo ERROR: Data import failed!
    echo Please check the error messages above.
    echo ======================================================================
)

echo.
echo You can now connect to your database with:
echo psql -U zenithpostgres -d zenith
echo.

pause
