# Deploying Zenith with Code Execution Service

This document provides step-by-step instructions for deploying the Zenith application with the integrated code execution service using Docker.

## Prerequisites

- Docker and Docker Compose installed on your server
- Git to clone the repository
- A domain name (optional but recommended for production)
- SSL certificates (optional but recommended for production)

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Vanesor/zenith.git
cd zenith
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp env.local.example .env
```

Edit the `.env` file and update the following variables:

- Database configuration (Supabase or PostgreSQL)
- Authentication secrets
- Set `CODE_EXECUTION_SERVICE_URL=http://code-execution:4000` for Docker deployment

### 3. Set Up Docker Networks and Volumes

```bash
# Create volumes for persistent data
docker volume create zenith_uploads
docker volume create zenith_postgres_data
docker volume create zenith_redis_data

# Create networks
docker network create zenith-network
```

### 4. Build and Start the Services

```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d
```

This will:
1. Build and start the code execution service
2. Start the database services
3. Start the cache services
4. Start the application instances
5. Set up the Nginx load balancer

### 5. Verify the Deployment

Check if all services are running:

```bash
docker-compose -f docker-compose.production.yml ps
```

Test the code execution service:

```bash
curl http://localhost/api/code/health
```

### 6. Setting Up SSL (Optional)

If you have SSL certificates:

1. Place your SSL certificates in the `./ssl` directory:
   - `./ssl/certificate.crt`
   - `./ssl/private.key`

2. Update the Nginx configuration to use HTTPS

### 7. Troubleshooting

#### Code Execution Service Issues

If the code execution service is not working properly:

1. Check the logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs code-execution
   ```

2. Verify that the service is running:
   ```bash
   curl http://localhost:4000/health
   ```

3. Check if compilers are installed correctly:
   ```bash
   docker exec -it zenith-code-execution gcc --version
   docker exec -it zenith-code-execution python3 --version
   docker exec -it zenith-code-execution javac --version
   ```

#### Application Issues

If the application is not working properly:

1. Check the logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs app1
   ```

2. Verify that the application can connect to the code execution service:
   ```bash
   docker exec -it zenith-app-1 curl http://code-execution:4000/health
   ```

## Scaling the Services

### Scaling the Code Execution Service

To handle increased load for code execution, you can scale the code execution service:

```bash
docker-compose -f docker-compose.production.yml up -d --scale code-execution=3
```

Update the Nginx configuration to distribute load across multiple code execution instances.

### Scaling the Application

To handle increased user traffic, you can scale the application instances:

```bash
docker-compose -f docker-compose.production.yml up -d --scale app=5
```

## Maintenance

### Updating the Application

To update the application:

1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Rebuild and restart the services:
   ```bash
   docker-compose -f docker-compose.production.yml up -d --build
   ```

### Backup and Restore

To backup data:

```bash
docker exec -t zenith-postgres-master pg_dumpall -c -U postgres > zenith_backup_$(date +%Y-%m-%d_%H_%M_%S).sql
```

To restore from backup:

```bash
cat zenith_backup_file.sql | docker exec -i zenith-postgres-master psql -U postgres
```

## Security Considerations

The code execution service runs in an isolated container with restricted permissions. The following security measures are in place:

1. **Resource Limits**: CPU and memory limits are enforced
2. **Execution Timeouts**: Code execution is limited by time
3. **seccomp Profile**: System calls are restricted using the security profile in `execution-seccomp.json`
4. **No Network Access**: The container can be configured with no outbound network access
5. **Read-only File System**: The file system is mounted as read-only except for the temp directory

## Monitoring

Set up monitoring for the deployment:

1. **Container Metrics**: Use Docker's built-in metrics or tools like Prometheus
2. **Application Logs**: Centralize logs using ELK stack or a similar solution
3. **Health Checks**: Regularly check the health endpoints:
   - `/api/health` for the main application
   - `/api/code/health` for the code execution service

## Conclusion

This deployment setup ensures that your Zenith application can securely execute code in various programming languages while maintaining separation between the application and execution environments for security and scalability.
