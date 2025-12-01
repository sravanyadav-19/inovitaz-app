const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const setupDatabase = async () => {
  let connection;

  try {
    // Connect without database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    console.log('Connected to MySQL server');

    const dbName = process.env.DB_NAME || 'inovitaz';

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created/verified`);

    // Select the database
    await connection.query(`USE \`${dbName}\``);

    // DROP old tables so schema is guaranteed correct (DEV ONLY)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS orders');
    await connection.query('DROP TABLE IF EXISTS projects');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Old tables dropped (users, projects, orders)');

    // Create Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Users table created/verified');

    // Create Projects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        thumbnail VARCHAR(500),
        content_url VARCHAR(500),
        category VARCHAR(100) DEFAULT 'IoT',
        features JSON,
        tech_stack JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_price (price)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Projects table created/verified');

    // Create Orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_project_id (project_id),
        INDEX idx_status (status),
        INDEX idx_razorpay_order_id (razorpay_order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Orders table created/verified');

    // Create admin user if not exists
    const adminEmail = 'admin@inovitaz.com';
    const [existingAdmin] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await connection.query(
        `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'admin')`,
        [adminEmail, hashedPassword, 'Admin User']
      );
      console.log('Admin user created (admin@inovitaz.com / admin123)');
    }

    // Insert sample projects if none exist
    const [existingProjects] = await connection.query(
      'SELECT COUNT(*) as count FROM projects'
    );

    if (existingProjects[0].count === 0) {
      const sampleProjects = [
        {
          title: 'Smart Home Automation System',
          description:
            'Complete IoT-based home automation system with mobile app control. Features include smart lighting, temperature control, security monitoring, and voice assistant integration. Built with ESP32, MQTT protocol, and React Native mobile app.',
          price: 2499.0,
          thumbnail:
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          content_url: 'https://example.com/downloads/smart-home.zip',
          category: 'IoT',
          features: JSON.stringify([
            'ESP32-based controller',
            'React Native mobile app',
            'MQTT protocol',
            'Voice assistant integration',
            'Real-time monitoring',
            'Energy usage tracking',
          ]),
          tech_stack: JSON.stringify([
            'ESP32',
            'MQTT',
            'React Native',
            'Node.js',
            'MongoDB',
          ]),
        },
        {
          title: 'IoT Weather Monitoring Station',
          description:
            'Advanced weather monitoring system with real-time data visualization. Includes temperature, humidity, pressure, wind speed, and rainfall sensors. Features cloud data storage and web dashboard.',
          price: 1799.0,
          thumbnail:
            'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400',
          content_url: 'https://example.com/downloads/weather-station.zip',
          category: 'IoT',
          features: JSON.stringify([
            'Multiple sensor integration',
            'Real-time data visualization',
            'Historical data analysis',
            'Weather prediction',
            'Mobile alerts',
            'Solar powered option',
          ]),
          tech_stack: JSON.stringify([
            'Arduino',
            'ESP8266',
            'InfluxDB',
            'Grafana',
            'Python',
          ]),
        },
        {
          title: 'Automatic Plant Watering System',
          description:
            'Smart irrigation system for home gardens and farms. Automatically monitors soil moisture and waters plants based on requirements. Includes mobile app for remote monitoring and control.',
          price: 1299.0,
          thumbnail:
            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
          content_url: 'https://example.com/downloads/plant-watering.zip',
          category: 'IoT',
          features: JSON.stringify([
            'Soil moisture sensing',
            'Automatic watering schedule',
            'Water level monitoring',
            'Mobile app control',
            'Multiple zone support',
            'Water usage analytics',
          ]),
          tech_stack: JSON.stringify([
            'ESP32',
            'Flutter',
            'Firebase',
            'Soil Sensors',
          ]),
        },
        {
          title: 'Smart Energy Meter',
          description:
            'IoT-based energy monitoring system for homes and offices. Track real-time energy consumption, get usage analytics, and receive alerts for unusual consumption patterns.',
          price: 1999.0,
          thumbnail:
            'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
          content_url: 'https://example.com/downloads/energy-meter.zip',
          category: 'IoT',
          features: JSON.stringify([
            'Real-time consumption tracking',
            'Cost estimation',
            'Usage analytics',
            'Anomaly detection',
            'Bill prediction',
            'Multi-device support',
          ]),
          tech_stack: JSON.stringify([
            'ESP32',
            'Current Sensors',
            'React',
            'PostgreSQL',
            'Redis',
          ]),
        },
        {
          title: 'Vehicle GPS Tracking System',
          description:
            'Complete vehicle tracking solution with real-time location, speed monitoring, and geofencing. Includes web dashboard and mobile app for fleet management.',
          price: 2999.0,
          thumbnail:
            'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
          content_url: 'https://example.com/downloads/gps-tracker.zip',
          category: 'IoT',
          features: JSON.stringify([
            'Real-time GPS tracking',
            'Speed monitoring',
            'Geofencing alerts',
            'Route history',
            'Fuel monitoring',
            'Driver behavior analysis',
          ]),
          tech_stack: JSON.stringify([
            'ESP32',
            'GPS Module',
            'React',
            'Node.js',
            'MongoDB',
            'Google Maps API',
          ]),
        },
      ];

      for (const project of sampleProjects) {
        await connection.query(
          `INSERT INTO projects (title, description, price, thumbnail, content_url, category, features, tech_stack) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            project.title,
            project.description,
            project.price,
            project.thumbnail,
            project.content_url,
            project.category,
            project.features,
            project.tech_stack,
          ]
        );
      }
      console.log(`${sampleProjects.length} sample projects inserted`);
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@inovitaz.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

setupDatabase();