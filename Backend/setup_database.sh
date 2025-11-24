#!/bin/bash

# Database Setup Script for Study Pro Global
# This script helps set up the database with sample data

set -e

echo "======================================"
echo "Study Pro Global - Database Setup"
echo "======================================"
echo ""

# Configuration from .env or use defaults
DB_HOST=${DB_HOST:-"server10.cloudswebserver.com"}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-"myxenpay_studyproglobal"}
DB_NAME=${DB_NAME:-"myxenpay_studyproglobal"}

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if mysql client is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client is not installed"
    echo "Install it with: sudo apt-get install mysql-client"
    exit 1
fi

echo "✅ MySQL client found"
echo ""

# Test database connection
echo "Testing database connection..."
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Please check your credentials and network connectivity"
    exit 1
fi

echo ""
echo "Options:"
echo "1. Start Backend API (tables will be created automatically)"
echo "2. Import sample data (universities, scholarships, courses)"
echo "3. Check database status"
echo "4. Backup database"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Starting Backend API..."
        echo "Tables will be created automatically on first run"
        echo ""
        npm start
        ;;
    2)
        echo ""
        echo "Importing sample data..."
        echo "⚠️  Make sure the backend has been started at least once to create tables"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < sample_data.sql
            echo "✅ Sample data imported successfully"
        else
            echo "❌ Import cancelled"
        fi
        ;;
    3)
        echo ""
        echo "Checking database status..."
        echo ""
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << EOF
SHOW TABLES;
SELECT 'Users:' as 'Table', COUNT(*) as 'Count' FROM users
UNION ALL
SELECT 'Universities:', COUNT(*) FROM universities
UNION ALL
SELECT 'Programs:', COUNT(*) FROM programs
UNION ALL
SELECT 'Applications:', COUNT(*) FROM applications
UNION ALL
SELECT 'Subscriptions:', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'Scholarships:', COUNT(*) FROM scholarships
UNION ALL
SELECT 'Courses:', COUNT(*) FROM courses;
EOF
        ;;
    4)
        echo ""
        echo "Creating database backup..."
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
        echo "✅ Backup created: $BACKUP_FILE"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Done!"
