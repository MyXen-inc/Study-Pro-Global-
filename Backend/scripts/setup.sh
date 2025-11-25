#!/bin/bash
# Initial setup script

echo "📦 Setting up Study Pro Global Backend..."

# Create required directories
mkdir -p /home/myxenpay/studypro-backend/logs
mkdir -p /home/myxenpay/studyproglobal.com.bd/uploads

# Set permissions
chmod 755 /home/myxenpay/studypro-backend/logs
chmod 755 /home/myxenpay/studyproglobal.com.bd/uploads

# Install dependencies
cd /home/myxenpay/studypro-backend
npm ci

# Copy env file if not exists
if [ ! -f .env ]; then
    cp .env.production.example .env
    echo "⚠️  Please edit .env file with your actual credentials!"
fi

echo "✅ Setup complete! Don't forget to:"
echo "   1. Edit .env with your database credentials"
echo "   2. Generate JWT_SECRET and SESSION_SECRET"
echo "   3. Run: pm2 start ecosystem.config.js --env production"
