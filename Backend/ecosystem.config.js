module.exports = {
  apps: [
    {
      name: 'studyproglobal-api',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/studyproglobal/error.log',
      out_file: '/var/log/studyproglobal/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Restart delay
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      // Monitoring
      instance_var: 'INSTANCE_ID',
      // Cron restart (optional - restart at midnight)
      // cron_restart: '0 0 * * *'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:MyXen-inc/Study-Pro-Global.git',
      path: '/var/www/studyproglobal',
      'pre-deploy-local': '',
      'post-deploy': 'cd Backend && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
