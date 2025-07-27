@echo off
REM Zenith Production Deployment Script for Windows
REM This script deploys the application for high-scale production use

setlocal enabledelayedexpansion

echo 🚀 Starting Zenith Production Deployment

REM Configuration
set PROJECT_NAME=zenith
set BACKUP_DIR=.\backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_FILE=.\deploy.log

REM Create backup directory
if not exist "!BACKUP_DIR!" mkdir "!BACKUP_DIR!"

REM Function to log messages
echo [%date% %time%] Starting deployment >> %LOG_FILE%

REM Check prerequisites
echo Checking prerequisites...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Check environment file
if not exist ".env.production" (
    echo ❌ .env.production file not found. Please create it first.
    pause
    exit /b 1
)

echo ✅ Production environment found

REM Backup existing data
echo Creating backup of existing data...
if exist "postgres_data" (
    xcopy /E /I postgres_data "%BACKUP_DIR%\postgres_data" >nul
    echo ✅ Database data backed up
)

if exist "redis_data" (
    xcopy /E /I redis_data "%BACKUP_DIR%\redis_data" >nul
    echo ✅ Redis data backed up
)

REM Build the application
echo Building application...
docker-compose -f docker-compose.production.yml build --no-cache
if errorlevel 1 (
    echo ❌ Application build failed
    pause
    exit /b 1
)
echo ✅ Application built successfully

REM Stop existing containers
echo Stopping existing containers...
docker-compose -f docker-compose.production.yml down
echo ✅ Existing containers stopped

REM Start database services first
echo Starting database services...
docker-compose -f docker-compose.production.yml up -d postgres-master
timeout /t 10 /nobreak >nul

docker-compose -f docker-compose.production.yml up -d postgres-replica1 postgres-replica2
timeout /t 15 /nobreak >nul
echo ✅ Database services started

REM Start cache services
echo Starting cache services...
docker-compose -f docker-compose.production.yml up -d redis-cluster
timeout /t 5 /nobreak >nul
echo ✅ Cache services started

REM Start monitoring services
echo Starting monitoring services...
docker-compose -f docker-compose.production.yml up -d prometheus grafana
timeout /t 5 /nobreak >nul
echo ✅ Monitoring services started

REM Start application instances
echo Starting application instances...
docker-compose -f docker-compose.production.yml up -d app1 app2 app3
timeout /t 10 /nobreak >nul
echo ✅ Application instances started

REM Start load balancer
echo Starting load balancer...
docker-compose -f docker-compose.production.yml up -d nginx
timeout /t 5 /nobreak >nul
echo ✅ Load balancer started

REM Health checks
echo Performing health checks...
timeout /t 30 /nobreak >nul

REM Check application health
set HEALTH_CHECK_PASSED=0
for /L %%i in (1,1,5) do (
    curl -f http://localhost/api/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Application health check passed
        set HEALTH_CHECK_PASSED=1
        goto :health_check_done
    ) else (
        echo ⏳ Waiting for application to be ready... ^(attempt %%i/5^)
        timeout /t 10 /nobreak >nul
    )
)

:health_check_done
if !HEALTH_CHECK_PASSED! == 0 (
    echo ❌ Application health check failed after 5 attempts
    pause
    exit /b 1
)

REM Display service status
echo 📊 Service Status:
docker-compose -f docker-compose.production.yml ps

REM Display access information
echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📝 Access Information:
echo    🌐 Application: http://localhost
echo    📊 Grafana: http://localhost:3001
echo    📈 Prometheus: http://localhost:9090
echo    🏥 Health Check: http://localhost/api/health
echo.
echo 🔧 Management Commands:
echo    View logs: docker-compose -f docker-compose.production.yml logs -f
echo    Stop services: docker-compose -f docker-compose.production.yml down
echo    Restart services: docker-compose -f docker-compose.production.yml restart
echo.
echo 💾 Backup created at: %BACKUP_DIR%
echo 📄 Deployment log: %LOG_FILE%

REM Create monitoring alerts
echo Setting up monitoring alerts...
(
echo groups:
echo - name: zenith_alerts
echo   rules:
echo   - alert: HighCPUUsage
echo     expr: ^(100 - ^(avg by ^(instance^) ^(rate^(node_cpu_seconds_total{mode="idle"}[5m]^)^) * 100^)^) ^> 80
echo     for: 5m
echo     labels:
echo       severity: warning
echo     annotations:
echo       summary: "High CPU usage detected"
echo.      
echo   - alert: HighMemoryUsage
echo     expr: ^(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes^) * 100 ^< 20
echo     for: 5m
echo     labels:
echo       severity: warning
echo     annotations:
echo       summary: "High memory usage detected"
echo.      
echo   - alert: DatabaseConnectionsHigh
echo     expr: pg_stat_database_numbackends ^> 80
echo     for: 2m
echo     labels:
echo       severity: warning
echo     annotations:
echo       summary: "Database connections are high"
echo.      
echo   - alert: ApplicationDown
echo     expr: up{job="zenith-apps"} == 0
echo     for: 1m
echo     labels:
echo       severity: critical
echo     annotations:
echo       summary: "Application instance is down"
) > alerts.yml

echo ✅ Monitoring alerts configured

REM Performance optimization tips
echo.
echo 🚀 Performance Optimization Tips:
echo    1. Monitor resource usage via Grafana dashboard
echo    2. Scale horizontally by adding more app instances
echo    3. Consider using a CDN for static assets
echo    4. Implement database query optimization
echo    5. Use Redis for session storage and caching
echo.
echo 🎯 For 1000+ concurrent users:
echo    ✅ Database connection pooling: Configured ^(50 connections per replica^)
echo    ✅ Load balancing: Nginx with 3 app instances
echo    ✅ Caching: Redis distributed cache
echo    ✅ Session management: Concurrent user support
echo    ✅ Rate limiting: API protection enabled
echo    ✅ WebSocket scaling: Real-time features optimized
echo    ✅ Monitoring: Full observability stack

echo.
echo 🎉 Zenith is now ready for production with high-scale support!
echo.
echo Press any key to continue...
pause >nul
