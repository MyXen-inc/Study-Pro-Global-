# Study Pro Global - Server Configuration Guide

## Production Server Information

**⚠️ SECURITY NOTICE: Never commit actual credentials to version control!**

All sensitive credentials should be stored in:
1. A secure `.env` file on the server (listed in `.gitignore`)
2. A secure secrets management system
3. Environment variables set directly on the server

### Server Setup

- **Domain**: `www.studyproglobal.com.bd`
- **Protocol**: HTTPS (SSL Certificate required)
- **Database Type**: MySQL/MariaDB

### Environment Variable Configuration

Create a `.env` file on your production server using `.env.example` as a template:

```bash
# Copy the example file
cp .env.example .env

# Edit and add your actual credentials
nano .env
```

**Required Environment Variables:**
- `DB_HOST` - Your database host
- `DB_PORT` - Database port (default: 3306)
- `DB_NAME` - Your database name
- `DB_USER` - Your database username
- `DB_PASSWORD` - Your database password
- `JWT_SECRET` - A secure random secret for JWT tokens
- `SESSION_SECRET` - A secure random secret for sessions

Generate secure secrets:
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Connection String Examples

All examples below use environment variables. Replace placeholders with actual values in your `.env` file only.

#### MySQL Command Line
```bash
mysql -h $DB_HOST \
      -u $DB_USER \
      -p$DB_PASSWORD \
      $DB_NAME
```

#### Node.js (mysql2)
```javascript
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

#### Python (MySQL Connector)
```python
import mysql.connector
import os

db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    port=int(os.getenv("DB_PORT", 3306))
)
```

#### PHP (PDO)
```php
$host = getenv('DB_HOST');
$db = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASSWORD');

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
```

### Security Best Practices

1. **Never commit credentials to version control**
   - Use `.env` files (add to `.gitignore`)
   - Use environment variables
   - Use a secrets management system

2. **Use strong passwords**
   - At least 16 characters
   - Mix of letters, numbers, and symbols
   - Unique for each service

3. **Restrict database access**
   - Configure MySQL to only accept connections from specific IPs
   - Use SSL/TLS for database connections if available

4. **Regular backups**
   - Set up automated daily database backups
   - Store backups securely offsite
   - Test backup restoration regularly

5. **Monitor access**
   - Enable MySQL query logging
   - Monitor for suspicious database activity
   - Set up alerts for failed login attempts

### Server Setup Checklist

- [ ] SSH access configured
- [ ] Node.js installed (v16+ or v18+)
- [ ] MySQL client installed
- [ ] Database connection verified
- [ ] PM2 installed globally
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Backend `.env` file configured with real credentials
- [ ] Frontend deployed to web directory
- [ ] PM2 process running
- [ ] Domain DNS pointing to server

### Quick Test

Test database connection (use your actual credentials from `.env`):

```bash
# From command line - use environment variables
mysql -h $DB_HOST \
      -u $DB_USER \
      -p$DB_PASSWORD \
      -e "SELECT VERSION(); SHOW DATABASES;"
```

### Troubleshooting

#### Cannot connect to database

**Check 1: Network connectivity**
```bash
ping $DB_HOST
telnet $DB_HOST 3306
```

**Check 2: Credentials**
- Verify username and password are correct in `.env`
- Check if user has necessary privileges
- Ensure database name is spelled correctly

**Check 3: Firewall**
- MySQL port 3306 must be accessible
- Contact hosting provider if blocked

### Additional Resources

- **Full Deployment Guide**: See `Backend/DEPLOYMENT.md`
- **API Documentation**: See `API/README.md`
- **Backend Implementation**: See `Backend/README.md`

---

**Last Updated**: 2025-11-24  
**Platform**: Study Pro Global - EdTech Platform of MyXen Foundation
