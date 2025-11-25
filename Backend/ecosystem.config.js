module.exports = {
  apps: [{
    name: 'studyproglobal-api',
    script: 'server.js',
    cwd: '/home/myxenpay/studypro-backend',
    instances: process.env.PM2_INSTANCES || 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/myxenpay/studypro-backend/logs/error.log',
    out_file: '/home/myxenpay/studypro-backend/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
