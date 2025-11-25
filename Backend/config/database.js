const mysql = require('mysql2/promise');

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'server10.cloudswebserver.com',
  user: process.env.DB_USER || 'myxenpay_studyproglobal',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'myxenpay_studyproglobal',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        country VARCHAR(100),
        academic_level VARCHAR(50),
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        subscription_type VARCHAR(50) DEFAULT 'free',
        subscription_expires_at DATETIME,
        free_applications_used INT DEFAULT 0,
        profile_complete INT DEFAULT 0,
        role VARCHAR(20) DEFAULT 'student',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_subscription (subscription_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Universities table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        description TEXT,
        ranking INT,
        tuition_range VARCHAR(100),
        has_scholarships BOOLEAN DEFAULT false,
        website VARCHAR(255),
        contact_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_country (country)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Programs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS programs (
        id VARCHAR(36) PRIMARY KEY,
        university_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        level VARCHAR(50),
        duration VARCHAR(50),
        tuition_fee DECIMAL(10, 2),
        requirements TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
        INDEX idx_university (university_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Applications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        university_id VARCHAR(36) NOT NULL,
        program_id VARCHAR(36) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        personal_statement TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (university_id) REFERENCES universities(id),
        FOREIGN KEY (program_id) REFERENCES programs(id),
        INDEX idx_user (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Documents table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255),
        file_size INT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Subscriptions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_method VARCHAR(50),
        started_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Payments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        subscription_id VARCHAR(36),
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        transaction_hash VARCHAR(255),
        payment_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
        INDEX idx_user (user_id),
        INDEX idx_status (payment_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Scholarships table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS scholarships (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        amount VARCHAR(100),
        level VARCHAR(50),
        eligibility TEXT,
        deadline DATE,
        description TEXT,
        application_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_country (country),
        INDEX idx_deadline (deadline)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Courses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0,
        description TEXT,
        duration VARCHAR(50),
        content TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Chat conversations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Chat messages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL,
        role VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
        INDEX idx_conversation (conversation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Blog posts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content LONGTEXT NOT NULL,
        excerpt VARCHAR(300),
        featured_image VARCHAR(500),
        featured_image_alt VARCHAR(200),
        meta_description VARCHAR(160),
        focus_keyword VARCHAR(100),
        author_id VARCHAR(36) NOT NULL,
        status ENUM('draft', 'published', 'scheduled') DEFAULT 'draft',
        published_at DATETIME,
        scheduled_for DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        views_count INT DEFAULT 0,
        reading_time_minutes INT DEFAULT 5,
        INDEX idx_slug (slug),
        INDEX idx_status (status),
        INDEX idx_published_at (published_at),
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Blog categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Blog post categories junction table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_post_categories (
        post_id VARCHAR(36),
        category_id VARCHAR(36),
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Blog tags table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_tags (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Blog post tags junction table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_post_tags (
        post_id VARCHAR(36),
        tag_id VARCHAR(36),
        PRIMARY KEY (post_id, tag_id),
        FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Database tables initialized successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
