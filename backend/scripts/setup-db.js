const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const setupDatabase = async () => {
  let connection;

  try {
    // 1. Connect to the database defined in .env
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false } // Required for Aiven
    });

    console.log(`Connected to database: ${process.env.DB_NAME}`);

    // 2. Drop old tables (Order matters due to foreign keys)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = ['download_logs', 'coupon_usage', 'reviews', 'wishlist', 'orders', 'coupons', 'projects', 'users'];
    for (const table of tables) {
      await connection.query(`DROP TABLE IF EXISTS ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old tables dropped');

    // 3. Create Users Table
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Projects Table (FIXED: Added missing columns)
    await connection.query(`
      CREATE TABLE projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        thumbnail VARCHAR(500),
        content_url VARCHAR(500),
        category VARCHAR(100) DEFAULT 'IoT',
        difficulty VARCHAR(50) DEFAULT 'Beginner', -- New Column
        average_rating DECIMAL(3, 2) DEFAULT 0.00, -- New Column
        reviews_count INT DEFAULT 0,               -- New Column
        features JSON,
        tech_stack JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 5. Create Orders Table
    await connection.query(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        original_amount DECIMAL(10, 2),
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        coupon_code VARCHAR(50),
        status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // 6. Create Reviews Table
    await connection.query(`
      CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        order_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        is_verified_purchase BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 7. Create Wishlist Table
    await connection.query(`
      CREATE TABLE wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_project (user_id, project_id)
      )
    `);

    // 8. Create Coupons Table
    await connection.query(`
      CREATE TABLE coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255),
        discount_type ENUM('percentage', 'fixed') NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        min_purchase_amount INT DEFAULT 0,
        max_discount_amount INT DEFAULT NULL,
        usage_limit INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        valid_until DATETIME DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Create Coupon Usage Table
    await connection.query(`
      CREATE TABLE coupon_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        user_id INT NOT NULL,
        order_id INT NOT NULL,
        discount_amount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
      )
    `);

    // 10. Create Download Logs Table
    await connection.query(`
      CREATE TABLE download_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        order_id INT NOT NULL,
        download_count INT DEFAULT 0,
        max_downloads INT DEFAULT 5,
        expiry_date DATETIME NOT NULL,
        last_downloaded_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ All tables created successfully');

    // 11. Create Admin User
    const adminEmail = 'admin@inovitaz.com';
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await connection.query(
      `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'admin')`,
      [adminEmail, hashedPassword, 'Admin User']
    );
    console.log('✅ Admin user created');

    // 12. Insert Sample Projects (With new columns)
    const sampleProjects = [
      {
        title: 'Smart Home Automation System',
        description: JSON.stringify({ overview: 'Complete IoT-based home automation system with mobile app control.' }),
        price: 2499.0,
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        content_url: '#',
        category: 'IoT',
        difficulty: 'Advanced',
        features: JSON.stringify(['App Control', 'Voice Command']),
        tech_stack: JSON.stringify(['ESP32', 'React Native'])
      },
      {
        title: 'IoT Weather Monitoring Station',
        description: JSON.stringify({ overview: 'Advanced weather monitoring system with real-time data visualization.' }),
        price: 1799.0,
        thumbnail: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400',
        content_url: '#',
        category: 'IoT',
        difficulty: 'Intermediate',
        features: JSON.stringify(['Real-time Data', 'Cloud Storage']),
        tech_stack: JSON.stringify(['Arduino', 'InfluxDB'])
      },
      {
        title: 'Automatic Plant Watering System',
        description: JSON.stringify({ overview: 'Smart irrigation system for home gardens and farms.' }),
        price: 1299.0,
        thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        content_url: '#',
        category: 'IoT',
        difficulty: 'Beginner',
        features: JSON.stringify(['Soil Sensor', 'Auto Water']),
        tech_stack: JSON.stringify(['ESP8266', 'C++'])
      },
      {
        title: 'Vehicle GPS Tracking System',
        description: JSON.stringify({ overview: 'Real-time vehicle tracking with Google Maps integration.' }),
        price: 2999.0,
        thumbnail: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
        content_url: '#',
        category: 'IoT',
        difficulty: 'Advanced',
        features: JSON.stringify(['GPS', 'Geofencing']),
        tech_stack: JSON.stringify(['GSM Module', 'Node.js'])
      },
      {
        title: 'Line Following Robot',
        description: JSON.stringify({ overview: 'Autonomous robot that follows a black line on the floor.' }),
        price: 999.0,
        thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
        content_url: '#',
        category: 'Robotics',
        difficulty: 'Beginner',
        features: JSON.stringify(['IR Sensors', 'Motor Driver']),
        tech_stack: JSON.stringify(['Arduino Uno', 'C++'])
      }
    ];

    for (const p of sampleProjects) {
      await connection.query(
        `INSERT INTO projects (title, description, price, thumbnail, content_url, category, difficulty, features, tech_stack) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.title, p.description, p.price, p.thumbnail, p.content_url, p.category, p.difficulty, p.features, p.tech_stack]
      );
    }
    console.log(`✅ ${sampleProjects.length} sample projects inserted`);

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    if (connection) await connection.end();
  }
};

setupDatabase();