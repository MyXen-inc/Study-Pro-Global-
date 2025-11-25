// PM2 Configuration for Study Pro Global Backend
// API runs on: api.studyproglobal.com.bd (port 3000)
// 
// Subdomain Structure:
// - www.studyproglobal.com.bd          → Frontend
// - api.studyproglobal.com.bd          → Backend API (this app)
// - mobile.studyproglobal.com.bd       → Mobile app
// - studypro-backend.studyproglobal.com.bd → Admin dashboard

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
