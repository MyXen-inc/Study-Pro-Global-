# Study Pro Global - Server Credentials

## Production Server Information

**⚠️ IMPORTANT: This file contains sensitive information. DO NOT share publicly.**

### Server Access

- **Server Address**: `server10.cloudswebserver.com`
- **Domain**: `www.studyproglobal.com.bd`
- **Protocol**: HTTPS (SSL Certificate required)

### Database Credentials

- **Database Host**: `server10.cloudswebserver.com`
- **Database Port**: `3306` (MySQL default)
- **Database Name**: `myxenpay_studyproglobal`
- **Database User**: `myxenpay_studyproglobal`
- **Database Password**: `Nazmuzsakib01715@@##`
- **Database Type**: MySQL/MariaDB

### Connection String Examples

#### MySQL Command Line
```bash
mysql -h server10.cloudswebserver.com \
      -u myxenpay_studyproglobal \
      -p'Nazmuzsakib01715@@##' \
      myxenpay_studyproglobal
```

#### Node.js (Sequelize)
```javascript
const sequelize = new Sequelize(
  'myxenpay_studyproglobal',
  'myxenpay_studyproglobal',
  'Nazmuzsakib01715@@##',
  {
    host: 'server10.cloudswebserver.com',
    dialect: 'mysql',
    port: 3306,
    logging: false
  }
);
```

#### Node.js (mysql2)
```javascript
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'server10.cloudswebserver.com',
  user: 'myxenpay_studyproglobal',
  password: 'Nazmuzsakib01715@@##',
  database: 'myxenpay_studyproglobal',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

#### Python (MySQL Connector)
```python
import mysql.connector

db = mysql.connector.connect(
    host="server10.cloudswebserver.com",
    user="myxenpay_studyproglobal",
    password="Nazmuzsakib01715@@##",
    database="myxenpay_studyproglobal",
    port=3306
)
```

#### PHP (PDO)
```php
$host = 'server10.cloudswebserver.com';
$db = 'myxenpay_studyproglobal';
$user = 'myxenpay_studyproglobal';
$pass = 'Nazmuzsakib01715@@##';

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

### Environment Variable Configuration

These credentials are already configured in:
- `Backend/.env.production`
- `Backend/.env.example` (template)

**Important**: The `.env.production` file contains the actual credentials. Make sure it's:
1. ✅ Present on the production server
2. ✅ Listed in `.gitignore` (already done)
3. ❌ Never committed to version control
4. ❌ Never shared publicly

### Security Recommendations

1. **Change Database Password** (if possible)
   - Contact your hosting provider to change the database password
   - Update `.env.production` with the new password
   - Restart the backend service

2. **Restrict Database Access**
   - Configure MySQL to only accept connections from specific IPs
   - Use SSL/TLS for database connections if available

3. **Regular Backups**
   - Set up automated daily database backups
   - Store backups securely offsite
   - See `Backend/DEPLOYMENT.md` Step 11.2 for backup script

4. **Monitor Access**
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
- [ ] Backend `.env` file configured
- [ ] Frontend deployed to web directory
- [ ] PM2 process running
- [ ] Domain DNS pointing to server

### Quick Test

Test database connection:

```bash
# From command line
mysql -h server10.cloudswebserver.com \
      -u myxenpay_studyproglobal \
      -p'Nazmuzsakib01715@@##' \
      -e "SELECT VERSION(); SHOW DATABASES;"
```

Expected output:
```
+------------+
| VERSION()  |
+------------+
| 8.0.x      |
+------------+

+----------------------------+
| Database                   |
+----------------------------+
| myxenpay_studyproglobal    |
+----------------------------+
```

### Troubleshooting

#### Cannot connect to database

**Check 1: Network connectivity**
```bash
ping server10.cloudswebserver.com
telnet server10.cloudswebserver.com 3306
```

**Check 2: Credentials**
- Verify username and password are correct
- Check if user has necessary privileges
- Ensure database name is spelled correctly

**Check 3: Firewall**
- MySQL port 3306 must be accessible
- Contact hosting provider if blocked

#### Permission issues

```sql
-- Check user permissions
SHOW GRANTS FOR 'myxenpay_studyproglobal'@'%';

-- If needed, grant all privileges (requires admin access)
GRANT ALL PRIVILEGES ON myxenpay_studyproglobal.* 
TO 'myxenpay_studyproglobal'@'%';
FLUSH PRIVILEGES;
```

### Support Contacts

- **Hosting Provider**: server10.cloudswebserver.com support
- **Database Admin**: Contact server administrator
- **Project Lead**: admin@studyproglobal.com.bd

### Additional Resources

- **Full Deployment Guide**: See `Backend/DEPLOYMENT.md`
- **API Documentation**: See `API/README.md`
- **Backend Implementation**: See `Backend/README.md`

---

**Last Updated**: 2025-11-24  
**Platform**: Study Pro Global - EdTech Platform of MyXen Foundation
