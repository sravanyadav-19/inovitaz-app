-- sql/schema.sql
CREATE DATABASE IF NOT EXISTS inovitaz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inovitaz_db;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM("user","admin") DEFAULT "user",
  name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS projects;
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price INT NOT NULL DEFAULT 49900, -- price in paise
  thumbnail VARCHAR(512),
  content_url VARCHAR(1024),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('created','paid','failed') DEFAULT 'created',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- seed admin (password hash for "admin123" bcrypt)
INSERT IGNORE INTO users (email, password, role, name) VALUES
('admin@local', '$2a$10$7u7f5H1nG6l1y3P0/1qXfuVwYvX5bKf/7dTq9C3k8WqJp3yHqGqW6', 'admin', 'Admin User');

INSERT IGNORE INTO projects (title, description, price) VALUES
('Automated Plant Watering System', 'Soil moisture-based irrigation with mobile monitoring. Complete guide.', 49900),
('IoT Weather Monitoring Station', 'Real-time weather monitoring with cloud-based dashboard and docs.', 49900),
('Smart Home Automation System', 'Complete IoT home automation with mobile control and docs.', 49900);
