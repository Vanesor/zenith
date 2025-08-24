// Simple PM2 Configuration - Only Main App
module.exports = {
  apps: [
    {
      name: 'zenith',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart configuration
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Monitoring
      watch: false,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000
    }
  ]
};
