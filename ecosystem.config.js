// PM2 Configuration for production deployment
module.exports = {
  apps: [
    {
      name: 'zenith-forum',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Restart configuration
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      monitoring: true,
      pmx: true,
      
      // Auto restart on file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Health check
      health_check_url: 'http://localhost:3000/api/health',
      health_check_grace_period: 3000
    }
  ]
};
